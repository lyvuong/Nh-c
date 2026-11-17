import { db, type DBSetlist, type DBSong } from './db';
import {
  type DriveFileItem,
  SETLIST_FILE_SUFFIX,
  ensureShareFolder,
  ensureUuids,
  extractFolderInfo,
  fetchSetlistBundle,
  fetchModifiedTime,
  folderLink,
  importSetlistBundle,
  listSetlistFiles,
  publishSetlistToDrive,
  requestDriveAccessToken,
  resolveApiKey,
  resolveClientId,
} from './googleDrive';

// ---------------------------------------------------------------------------
// Simple setlist sharing on top of Google Drive.
//   Pull:    paste a shared folder link, tick the setlists you want, no sign-in.
//   Publish: one tap sign-in, the app creates a link-shared folder and uploads setlists.
// This module tracks what was pulled / published so the UI can say what changed.
// ---------------------------------------------------------------------------

const STATE_KEY = 'setlistShareState';

export interface ShareSource {
  folderId: string;
  resourceKey?: string;
  name: string;
  url: string;
  lastChecked?: number;
}

interface PulledRecord {
  fileId: string;
  setlistUuid: string;
  name: string;
  remoteModified: string; // Drive modifiedTime of the file when it was pulled
  localFingerprint: number; // newest edit time of the local copy right after the pull
}

interface PublishedRecord {
  setlistUuid: string;
  fileId: string;
  folderId: string;
  publishedAt: number;
  fingerprint: number; // newest edit time of the setlist (and its songs) when it was published
}

interface ShareState {
  sources: ShareSource[];
  pulled: Record<string, PulledRecord>; // by Drive file id
  published: Record<string, PublishedRecord>; // by setlist uuid
  ownFolder?: { id: string; name: string };
}

async function loadState(): Promise<ShareState> {
  const row = await db.settings.get(STATE_KEY);
  const v = row?.value as Partial<ShareState> | undefined;
  return { sources: v?.sources ?? [], pulled: v?.pulled ?? {}, published: v?.published ?? {}, ownFolder: v?.ownFolder };
}

async function saveState(state: ShareState): Promise<void> {
  await db.settings.put({ key: STATE_KEY, value: state });
}

// Read-modify-write in one place so concurrent actions don't clobber each other's records
async function updateState(fn: (s: ShareState) => void): Promise<ShareState> {
  const state = await loadState();
  fn(state);
  await saveState(state);
  return state;
}

// Newest edit time across a setlist and the songs in it, used to notice local edits after a pull/publish
async function fingerprintOf(setlist: DBSetlist): Promise<number> {
  const songs = await db.songs.bulkGet([...new Set(setlist.songs.map((e) => e.songId))]);
  return Math.max(setlist.updatedAt, ...songs.map((s) => s?.updatedAt ?? 0));
}

async function setlistByUuid(uuid: string): Promise<DBSetlist | undefined> {
  return db.setlists.where('uuid').equals(uuid).first();
}

// ---------------------------------------------------------------------------
// Sign-in (publish only)
// ---------------------------------------------------------------------------

let tokenCache: { token: string; expires: number } | null = null;

// Must be the first await in a click handler so the Google sign-in popup isn't blocked.
export async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expires) return tokenCache.token;
  const clientId = resolveClientId();
  if (!clientId) {
    throw new Error('Publishing is not set up in this build (no Google Client ID).');
  }
  const token = await requestDriveAccessToken(clientId);
  tokenCache = { token, expires: Date.now() + 50 * 60 * 1000 };
  return token;
}

// ---------------------------------------------------------------------------
// Pull
// ---------------------------------------------------------------------------

export type PullStatus = 'new' | 'update' | 'conflict' | 'localChanged' | 'current';
export type Resolution = 'overwrite' | 'copy' | 'skip';

export interface RemoteSetlist {
  file: DriveFileItem;
  displayName: string;
  status: PullStatus;
}

export interface UpdateSummary {
  added: string[];
  removed: string[];
  edited: string[];
  reordered: boolean;
}

export function describeSummary(s: UpdateSummary): string {
  const parts: string[] = [];
  if (s.added.length) parts.push(`+${s.added.length} song${s.added.length > 1 ? 's' : ''}`);
  if (s.removed.length) parts.push(`−${s.removed.length} song${s.removed.length > 1 ? 's' : ''}`);
  if (s.edited.length) parts.push(`${s.edited.length} edited`);
  if (s.reordered) parts.push('reordered');
  return parts.length ? parts.join(', ') : 'setlist details changed';
}

export async function getSources(): Promise<ShareSource[]> {
  return (await loadState()).sources;
}

export async function removeSource(folderId: string): Promise<void> {
  await updateState((s) => {
    s.sources = s.sources.filter((x) => x.folderId !== folderId);
  });
}

async function statusOf(file: DriveFileItem, state: ShareState): Promise<PullStatus> {
  const rec = state.pulled[file.id];
  if (!rec) return 'new';
  const local = await setlistByUuid(rec.setlistUuid);
  if (!local) return 'new'; // deleted on this device, so it can be pulled again
  const remoteChanged = !!file.modifiedTime && file.modifiedTime !== rec.remoteModified;
  const localChanged = (await fingerprintOf(local)) > rec.localFingerprint;
  if (remoteChanged && localChanged) return 'conflict';
  if (remoteChanged) return 'update';
  return localChanged ? 'localChanged' : 'current';
}

const displayNameOf = (f: DriveFileItem) => f.name.replace(SETLIST_FILE_SUFFIX, '');

// List the setlists in a shared folder link (no sign-in) and say what each one needs
export async function lookUpFolder(
  link: string,
  apiKeyOverride?: string
): Promise<{ source: ShareSource; setlists: RemoteSetlist[] }> {
  const info = extractFolderInfo(link);
  if (!info) throw new Error('That does not look like a Google Drive folder link.');
  const apiKey = apiKeyOverride?.trim() || resolveApiKey();
  if (!apiKey) throw new Error('This build has no Google API key configured.');

  const files = await listSetlistFiles(info.folderId, undefined, apiKey, info.resourceKey);
  const state = await loadState();
  const setlists: RemoteSetlist[] = [];
  for (const file of files) {
    setlists.push({ file, displayName: displayNameOf(file), status: await statusOf(file, state) });
  }
  setlists.sort((a, b) => a.displayName.localeCompare(b.displayName));

  const existing = state.sources.find((s) => s.folderId === info.folderId);
  const source: ShareSource = {
    folderId: info.folderId,
    resourceKey: info.resourceKey,
    name: existing?.name ?? 'Shared setlists',
    url: link.trim(),
    lastChecked: Date.now(),
  };
  await updateState((s) => {
    s.sources = [source, ...s.sources.filter((x) => x.folderId !== source.folderId)];
  });
  return { source, setlists };
}

export async function refreshSource(source: ShareSource): Promise<RemoteSetlist[]> {
  return (await lookUpFolder(source.url)).setlists;
}

// Compare a published setlist with the local copy so the user can see what an update would change
export async function summarizeUpdate(
  file: DriveFileItem,
  resourceKey?: string
): Promise<UpdateSummary | null> {
  const bundle = await fetchSetlistBundle(file.id, undefined, resolveApiKey(), resourceKey);
  const local = await setlistByUuid(bundle.setlist.uuid);
  if (!local) return null;

  const localSongs = await db.songs.bulkGet(local.songs.map((e) => e.songId));
  const localByUuid = new Map<string, DBSong>();
  local.songs.forEach((_, i) => {
    const s = localSongs[i];
    if (s?.uuid) localByUuid.set(s.uuid, s);
  });
  // Local copies are stored under a setlist-scoped uuid unless they were already forked
  const keyOf = (origUuid: string, forked?: string) => (forked ? origUuid : `${bundle.setlist.uuid}:${origUuid}`);

  const added: string[] = [];
  const edited: string[] = [];
  const seen = new Set<string>();
  for (const s of bundle.songs) {
    const key = keyOf(s.uuid, s.forkedFrom);
    seen.add(key);
    const mine = localByUuid.get(key);
    if (!mine) added.push(s.title);
    else if (
      mine.content !== s.content ||
      mine.title !== s.title ||
      mine.key !== s.key ||
      (mine.capo ?? 0) !== (s.capo ?? 0)
    ) {
      edited.push(s.title);
    }
  }
  const removed = [...localByUuid.entries()].filter(([k]) => !seen.has(k)).map(([, s]) => s.title);

  const remoteOrder = bundle.setlist.songs.map((e) => keyOf(e.songUuid, bundle.songs.find((x) => x.uuid === e.songUuid)?.forkedFrom));
  const localOrder = local.songs.map((_, i) => localSongs[i]?.uuid ?? '');
  const reordered =
    added.length + removed.length === 0 && remoteOrder.join('|') !== localOrder.join('|');

  return { added, removed, edited, reordered };
}

export interface PullItem {
  file: DriveFileItem;
  resolution: Resolution; // what to do with an existing local copy; ignored for new setlists
}

// Pull the chosen setlists. Nothing is overwritten unless the item says so.
export async function pullSetlists(
  source: ShareSource,
  items: PullItem[]
): Promise<{ pulled: number; songsAdded: number; songsUpdated: number; names: string[] }> {
  const apiKey = resolveApiKey();
  let songsAdded = 0;
  let songsUpdated = 0;
  const names: string[] = [];

  for (const { file, resolution } of items) {
    if (resolution === 'skip') continue;
    const modifiedTime = (await fetchModifiedTime(file.id, undefined, apiKey, source.resourceKey)) ?? file.modifiedTime;
    const bundle = await fetchSetlistBundle(file.id, undefined, apiKey, source.resourceKey);
    const asCopy = resolution === 'copy';
    // An untracked setlist that already exists here (e.g. your own published one) only takes newer data
    const tracked = !!(await loadState()).pulled[file.id];
    const existsLocally = !!(await setlistByUuid(bundle.setlist.uuid));
    const result = await importSetlistBundle(bundle, { force: !asCopy && (tracked || !existsLocally), asCopy });
    songsAdded += result.added;
    songsUpdated += result.updated;
    names.push(result.name);

    // A copy is a separate setlist: leave the tracking of the original untouched
    if (!asCopy) {
      const local = await setlistByUuid(result.setlistUuid);
      const fingerprint = local ? await fingerprintOf(local) : Date.now();
      await updateState((s) => {
        s.pulled[file.id] = {
          fileId: file.id,
          setlistUuid: result.setlistUuid,
          name: result.name,
          remoteModified: modifiedTime ?? '',
          localFingerprint: fingerprint,
        };
      });
    }
  }
  return { pulled: names.length, songsAdded, songsUpdated, names };
}

// Cheap check used on app open: how many pulled setlists have a newer version available?
export async function countAvailableUpdates(): Promise<number> {
  if (!navigator.onLine || !resolveApiKey()) return 0;
  const state = await loadState();
  const results = await Promise.allSettled(state.sources.map((src) => refreshSource(src)));
  const ids = new Set<string>();
  for (const r of results) {
    if (r.status !== 'fulfilled') continue;
    for (const s of r.value) if (s.status === 'update' || s.status === 'conflict') ids.add(s.file.id);
  }
  return ids.size;
}

// ---------------------------------------------------------------------------
// Publish
// ---------------------------------------------------------------------------

export type PublishStatus = 'new' | 'changed' | 'current';

export interface LocalSetlistStatus {
  id: number;
  name: string;
  songCount: number;
  status: PublishStatus;
  publishedAt?: number;
}

export async function listPublishStatuses(): Promise<{
  setlists: LocalSetlistStatus[];
  folder?: { id: string; name: string; url: string };
}> {
  await ensureUuids();
  const [setlists, state] = await Promise.all([db.setlists.toArray(), loadState()]);
  const out: LocalSetlistStatus[] = [];
  for (const sl of setlists) {
    const rec = state.published[sl.uuid!];
    let status: PublishStatus = 'new';
    if (rec) status = (await fingerprintOf(sl)) > rec.fingerprint ? 'changed' : 'current';
    out.push({ id: sl.id!, name: sl.name, songCount: sl.songs.length, status, publishedAt: rec?.publishedAt });
  }
  out.sort((a, b) => a.name.localeCompare(b.name));
  const f = state.ownFolder;
  return { setlists: out, folder: f ? { ...f, url: folderLink(f.id) } : undefined };
}

// Publish the chosen setlists into the app's own link-shared folder (created on first use)
export async function publishSetlists(
  setlistIds: number[]
): Promise<{ published: string[]; folder: { id: string; name: string; url: string } }> {
  // Sign-in first so the popup is tied to the user's tap
  const token = await getAccessToken();
  const state = await loadState();
  const folder = await ensureShareFolder(token, state.ownFolder?.id);
  await updateState((s) => {
    s.ownFolder = folder;
  });

  const published: string[] = [];
  for (const id of setlistIds) {
    const r = await publishSetlistToDrive({ setlistId: id, folderId: folder.id, accessToken: token });
    const setlist = await db.setlists.get(id);
    if (!setlist) continue;
    const fingerprint = await fingerprintOf(setlist);
    await updateState((s) => {
      s.published[setlist.uuid!] = {
        setlistUuid: setlist.uuid!,
        fileId: r.fileId,
        folderId: folder.id,
        publishedAt: r.publishedAt,
        fingerprint,
      };
    });
    published.push(r.name);
  }
  return { published, folder: { ...folder, url: folderLink(folder.id) } };
}
