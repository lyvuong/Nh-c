import { db, newUuid, type DBSong, type DBSetlist } from './db';
import { parseChordPro } from './chordParser';

export interface GoogleDriveConfig {
  clientId?: string;
  apiKey?: string;
  folderId?: string;
  folderName?: string;
  folderUrl?: string;
  resourceKey?: string;
  lastSyncTime?: number;
  publishFolderId?: string;
  publishFolderName?: string;
  shareFolderId?: string; // folder chosen for per-setlist publish/pull
  shareFolderName?: string;
  lastPublishTime?: number;
  syncMode?: 'oauth' | 'public' | 'local';
  autoSyncOnLoad?: boolean;
  pulledSetlistFileIds?: string[]; // setlist files pulled on this device, refreshed on app open
  // Files picked via the Drive Picker (OAuth mode); drive.file can only read what the user picked
  pickedFiles?: DriveFileItem[];
}

export interface ExtractedDriveInfo {
  folderId: string;
  resourceKey?: string;
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
}

const STORAGE_KEY = 'nhac_gdrive_config';
const SUPPORTED_EXTENSIONS = ['.cho', '.crd', '.chordpro', '.txt', '.pro', '.chopro'];

// Default public fallback Client ID (users can also provide their own)
export const DEFAULT_CLIENT_ID = '';

// Defaults baked in at build time via .env (VITE_GOOGLE_DRIVE_API_KEY / VITE_GOOGLE_DRIVE_FOLDER_URL),
// so a pre-configured deployment doesn't require every user to paste in their own API key/folder link.
function getEnvDefaults(): Partial<GoogleDriveConfig> {
  const defaults: Partial<GoogleDriveConfig> = {};

  const apiKey = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;
  if (apiKey) defaults.apiKey = apiKey;

  const folderUrl = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_URL;
  if (folderUrl) {
    const info = extractFolderInfo(folderUrl);
    if (info) {
      defaults.folderId = info.folderId;
      defaults.resourceKey = info.resourceKey;
      defaults.folderUrl = folderUrl;
    }
  }

  return defaults;
}

// Load saved config, filling in any gaps with the build-time env defaults above
export function loadDriveConfig(): GoogleDriveConfig {
  const base: GoogleDriveConfig = {
    syncMode: 'public',
    autoSyncOnLoad: false,
    ...getEnvDefaults(),
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...base, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to parse Google Drive config:', e);
  }
  return base;
}

// Save config
export function saveDriveConfig(config: GoogleDriveConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save Google Drive config:', e);
  }
}

// Parse Google Drive Folder ID and Security Resource Key (?resourcekey=...)
export function extractFolderInfo(input: string): ExtractedDriveInfo | null {
  if (!input) return null;
  const clean = input.trim();

  let folderId: string | null = null;
  let resourceKey: string | undefined = undefined;

  // Extract resource key from URL query (?resourcekey=... or &resourcekey=...)
  const resKeyMatch = clean.match(/[?&]resourcekey=([a-zA-Z0-9_-]+)/i);
  if (resKeyMatch && resKeyMatch[1]) {
    resourceKey = resKeyMatch[1];
  }

  // Pattern 1: https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
  // Pattern 2: https://drive.google.com/drive/u/0/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ
  // Pattern 3: https://drive.google.com/open?id=1aBcDeFgHiJkLmNoPqRsTuVwXyZ
  const folderMatch = clean.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch && folderMatch[1]) {
    folderId = folderMatch[1];
  } else {
    const idMatch = clean.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      folderId = idMatch[1];
    } else if (/^[a-zA-Z0-9_-]{15,}$/.test(clean)) {
      folderId = clean;
    }
  }

  if (folderId) {
    return { folderId, resourceKey };
  }
  return null;
}

export function extractFolderId(input: string): string | null {
  const info = extractFolderInfo(input);
  return info ? info.folderId : null;
}

// Check if a file name has a supported chord chart extension
export function isSupportedChordFile(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// Dynamically load Google Identity Services script
export function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

// Dynamically load Google Picker API script (gapi)
export function loadGooglePickerScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && (window as any).gapi?.picker) {
      resolve();
      return;
    }

    const existing = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
    if (existing) {
      if ((window as any).gapi) {
        (window as any).gapi.load('picker', () => resolve());
      } else {
        existing.addEventListener('load', () => {
          (window as any).gapi.load('picker', () => resolve());
        });
      }
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      (window as any).gapi.load('picker', () => resolve());
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
}

// Open native Google Drive visual Picker modal dialog.
// 'folder' picks a single folder (e.g. where to publish the library); 'files' lets the user tick
// several chord sheets. Under drive.file the app can only read files the user picked here.
export async function showDrivePicker(options: {
  accessToken: string;
  apiKey?: string;
  mode?: 'folder' | 'files';
  onSelected: (items: DriveFileItem[]) => void;
}): Promise<void> {
  await loadGooglePickerScript();
  const google = (window as any).google;
  if (!google?.picker) {
    throw new Error('Google Picker library could not be initialized');
  }

  const mode = options.mode || 'files';
  const builder = new google.picker.PickerBuilder()
    .setOAuthToken(options.accessToken)
    .setCallback((data: any) => {
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const docs: any[] = data[google.picker.Response.DOCUMENTS] || [];
        options.onSelected(
          docs.map((doc) => ({
            id: doc.id,
            name: doc.name,
            mimeType: doc.mimeType,
            modifiedTime: doc.lastEditedUtc ? new Date(doc.lastEditedUtc).toISOString() : undefined,
          }))
        );
      }
    });

  if (mode === 'folder') {
    const folderView = () =>
      new google.picker.DocsView(google.picker.ViewId.DOCS)
        .setIncludeFolders(true)
        .setSelectFolderEnabled(true)
        .setMimeTypes('application/vnd.google-apps.folder');
    builder
      // Folders other people shared with you
      .addView(folderView().setOwnedByMe(false).setLabel('Shared with me'))
      // Folders inside shared drives
      .addView(folderView().setEnableDrives(true).setLabel('Shared drives'))
      // Your own folders
      .addView(folderView().setOwnedByMe(true).setLabel('My Drive'))
      .enableFeature(google.picker.Feature.SUPPORT_DRIVES);
  } else {
    // Folders are browsable, but only the files ticked inside them are handed to the app
    builder
      .addView(new google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(false).setEnableDrives(true))
      .addView(new google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(false).setOwnedByMe(false))
      .enableFeature(google.picker.Feature.MULTISELECT_ENABLED)
      .enableFeature(google.picker.Feature.SUPPORT_DRIVES);
  }

  if (options.apiKey) {
    builder.setDeveloperKey(options.apiKey);
  }

  builder.build().setVisible(true);
}

// Request OAuth Access Token
// drive.file only reaches files the app created or the user picked, so the app never sees the rest of the Drive
export const DRIVE_FILE_SCOPE = 'https://www.googleapis.com/auth/drive.file';

export async function requestDriveAccessToken(
  clientId: string,
  scope: string = DRIVE_FILE_SCOPE
): Promise<string> {
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services library failed to load'));
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope,
      callback: (tokenResponse: any) => {
        if (tokenResponse.error) {
          reject(new Error(tokenResponse.error_description || tokenResponse.error));
          return;
        }
        resolve(tokenResponse.access_token);
      },
    });

    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
}

// Fetch files from a Google Drive folder recursively
export async function fetchDriveFolderFiles(
  folderId: string,
  accessToken?: string,
  apiKey?: string,
  resourceKey?: string
): Promise<DriveFileItem[]> {
  const items: DriveFileItem[] = [];

  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (resourceKey) {
    headers['X-Goog-Drive-Resource-Keys'] = `${folderId}/${resourceKey}`;
  }

  let pageToken: string | null = null;

  do {
    const queryParts = [
      `'${folderId}' in parents`,
      'trashed = false',
    ];
    const q = encodeURIComponent(queryParts.join(' and '));
    let url = `https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=nextPageToken,files(id,name,mimeType,modifiedTime,size)&pageSize=1000`;
    
    if (apiKey) {
      url += `&key=${encodeURIComponent(apiKey)}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Failed to list Google Drive files (${res.status}): ${errBody}`);
    }

    const data = await res.json();
    const files: DriveFileItem[] = data.files || [];

    for (const f of files) {
      if (f.mimeType === 'application/vnd.google-apps.folder') {
        // Recursive fetch for subfolders
        try {
          const subFiles = await fetchDriveFolderFiles(f.id, accessToken, apiKey, resourceKey);
          items.push(...subFiles);
        } catch (e) {
          console.warn(`Could not read subfolder ${f.name}:`, e);
        }
      } else if (f.mimeType === 'application/vnd.google-apps.document' || isSupportedChordFile(f.name)) {
        items.push(f);
      }
    }

    pageToken = data.nextPageToken || null;
  } while (pageToken);

  return items;
}

// Download raw ChordPro text content of a file (supports regular files and Google Docs)
export async function fetchDriveFileContent(
  fileId: string,
  accessToken?: string,
  apiKey?: string,
  mimeType?: string,
  resourceKey?: string
): Promise<string> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (resourceKey) {
    headers['X-Goog-Drive-Resource-Keys'] = `${fileId}/${resourceKey}`;
  }

  let url: string;
  if (mimeType === 'application/vnd.google-apps.document') {
    // Google Docs are exported as clean plain text
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain&supportsAllDrives=true`;
  } else {
    // Standard text / .cho files
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&supportsAllDrives=true`;
  }

  if (apiKey) {
    url += `${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to download file ${fileId} (${res.status}): ${errText}`);
  }

  const raw = await res.text();
  // Strip UTF-8 BOM if present and normalize line breaks
  return raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
}

// Get Folder Name metadata
export async function fetchDriveFolderName(
  folderId: string,
  accessToken?: string,
  apiKey?: string,
  resourceKey?: string
): Promise<string> {
  const headers: Record<string, string> = {};
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (resourceKey) {
    headers['X-Goog-Drive-Resource-Keys'] = `${folderId}/${resourceKey}`;
  }

  let url = `https://www.googleapis.com/drive/v3/files/${folderId}?fields=name&supportsAllDrives=true`;
  if (apiKey) {
    url += `&key=${encodeURIComponent(apiKey)}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (res.ok) {
      const data = await res.json();
      return data.name || 'Google Drive Folder';
    }
  } catch (e) {
    console.warn('Could not fetch folder metadata:', e);
  }
  return 'Google Drive Folder';
}

// ---------------------------------------------------------------------------
// Library publish / pull: one stagechord-library.json holding all songs + setlists.
// One device publishes (e.g. a laptop); other devices (e.g. a tablet) only pull.
// ---------------------------------------------------------------------------

export const LIBRARY_FILE_NAME = 'stagechord-library.json';
const LIBRARY_STATE_KEY = 'libraryState';

export interface LibrarySong extends Omit<DBSong, 'id' | 'uuid' | 'driveModifiedTime' | 'isFavorite'> {
  uuid: string;
}

export interface LibrarySetlist extends Omit<DBSetlist, 'id' | 'uuid' | 'songs'> {
  uuid: string;
  songs: { songUuid: string; customKey?: string; customCapo?: number; notes?: string }[];
}

export interface DriveLibrary {
  format: 'stagechord-library';
  version: 1;
  publishedAt: number;
  songs: LibrarySong[];
  setlists: LibrarySetlist[];
}

// What this device last took from a published library, so the next pull can tell what the
// publisher removed (only those items are pruned; locally created ones are left alone).
interface LibraryState {
  publishedAt: number;
  songUuids: string[];
  setlistUuids: string[];
}

async function ensureUuids(): Promise<void> {
  await db.songs.filter((s) => !s.uuid).modify((s) => {
    s.uuid = newUuid();
  });
  await db.setlists.filter((s) => !s.uuid).modify((s) => {
    s.uuid = newUuid();
  });
}

export async function buildLibrary(): Promise<DriveLibrary> {
  await ensureUuids();
  const [songs, setlists] = await Promise.all([db.songs.toArray(), db.setlists.toArray()]);
  const uuidById = new Map<number, string>();
  for (const s of songs) uuidById.set(s.id!, s.uuid!);

  return {
    format: 'stagechord-library',
    version: 1,
    publishedAt: Date.now(),
    songs: songs.map(({ id: _id, driveModifiedTime: _d, isFavorite: _f, uuid, ...rest }) => ({
      ...rest,
      uuid: uuid!,
    })),
    setlists: setlists.map(({ id: _id, uuid, songs: entries, ...rest }) => ({
      ...rest,
      uuid: uuid!,
      songs: entries
        .filter((e) => uuidById.has(e.songId))
        .map(({ songId, ...opts }) => ({ songUuid: uuidById.get(songId)!, ...opts })),
    })),
  };
}

function isLibrary(data: any): data is DriveLibrary {
  return (
    data &&
    data.format === 'stagechord-library' &&
    data.version === 1 &&
    Array.isArray(data.songs) &&
    Array.isArray(data.setlists)
  );
}

function authHeaders(accessToken?: string, fileOrFolderId?: string, resourceKey?: string) {
  const headers: Record<string, string> = {};
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  if (resourceKey && fileOrFolderId) {
    headers['X-Goog-Drive-Resource-Keys'] = `${fileOrFolderId}/${resourceKey}`;
  }
  return headers;
}

// Find the published library file inside a folder (non-recursive). Returns null if none.
export async function findLibraryFile(
  folderId: string,
  accessToken?: string,
  apiKey?: string,
  resourceKey?: string
): Promise<{ id: string; modifiedTime?: string } | null> {
  const q = encodeURIComponent(
    `'${folderId}' in parents and name = '${LIBRARY_FILE_NAME}' and trashed = false`
  );
  let url = `https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&orderBy=modifiedTime desc&fields=files(id,modifiedTime)&pageSize=1`;
  if (apiKey) url += `&key=${encodeURIComponent(apiKey)}`;

  const res = await fetch(url, { headers: authHeaders(accessToken, folderId, resourceKey) });
  if (!res.ok) {
    throw new Error(`Failed to look for ${LIBRARY_FILE_NAME} (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data.files?.[0] ?? null;
}

// Create or overwrite the library file in a folder the user picked with the drive.file scope.
export async function publishLibraryToDrive(params: {
  folderId: string;
  accessToken: string;
}): Promise<{ songs: number; setlists: number; publishedAt: number }> {
  const { folderId, accessToken } = params;
  const library = await buildLibrary();
  const existing = await findLibraryFile(folderId, accessToken);

  const boundary = `stagechord-${newUuid()}`;
  const metadata: Record<string, unknown> = { name: LIBRARY_FILE_NAME, mimeType: 'application/json' };
  if (!existing) metadata.parents = [folderId];

  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(library)}\r\n` +
    `--${boundary}--`;

  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart&supportsAllDrives=true`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true`;

  const res = await fetch(url, {
    method: existing ? 'PATCH' : 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`Failed to publish library (${res.status}): ${await res.text()}`);
  }

  return { songs: library.songs.length, setlists: library.setlists.length, publishedAt: library.publishedAt };
}

// Merge a published library into the local database. The publisher's copy wins for anything
// that came from it; songs and setlists created locally on this device are never touched.
export async function importLibrary(library: DriveLibrary): Promise<{
  added: number;
  updated: number;
  removed: number;
  skipped: boolean;
}> {
  const stateRow = await db.settings.get(LIBRARY_STATE_KEY);
  const prev: LibraryState | undefined = stateRow?.value;
  if (prev && prev.publishedAt === library.publishedAt) {
    return { added: 0, updated: 0, removed: 0, skipped: true };
  }

  let added = 0;
  let updated = 0;
  let removed = 0;

  await db.transaction('rw', db.songs, db.setlists, db.settings, async () => {
    await ensureUuids();
    const localSongs = await db.songs.toArray();
    const byUuid = new Map<string, DBSong>();
    for (const s of localSongs) byUuid.set(s.uuid!, s);

    // Songs already on this device from a folder sync have no shared uuid yet; adopt them by
    // title + artist instead of duplicating.
    const identity = (t: string, a?: string) => `${t.trim().toLowerCase()}|${(a || '').trim().toLowerCase()}`;
    const libUuids = new Set(library.songs.map((s) => s.uuid));
    const unclaimed = new Map<string, DBSong>();
    for (const s of localSongs) {
      if (!libUuids.has(s.uuid!) && !prev?.songUuids.includes(s.uuid!)) {
        unclaimed.set(identity(s.title, s.artist), s);
      }
    }

    const idByUuid = new Map<string, number>();
    for (const ls of library.songs) {
      const { uuid, ...fields } = ls;
      let local = byUuid.get(uuid);
      if (!local) {
        const match = unclaimed.get(identity(ls.title, ls.artist));
        if (match) {
          unclaimed.delete(identity(ls.title, ls.artist));
          local = match;
        }
      }
      if (local?.id != null) {
        if (local.uuid !== uuid || local.updatedAt !== ls.updatedAt) {
          await db.songs.update(local.id, { ...fields, uuid });
          updated++;
        }
        idByUuid.set(uuid, local.id);
      } else {
        const id = await db.songs.add({ ...fields, uuid, isFavorite: false } as DBSong);
        idByUuid.set(uuid, id);
        added++;
      }
    }

    const localSetlists = await db.setlists.toArray();
    const setlistByUuid = new Map<string, DBSetlist>();
    for (const s of localSetlists) setlistByUuid.set(s.uuid!, s);

    for (const sl of library.setlists) {
      const { uuid, songs: entries, ...fields } = sl;
      const songs = entries
        .filter((e) => idByUuid.has(e.songUuid))
        .map(({ songUuid, ...opts }) => ({ songId: idByUuid.get(songUuid)!, ...opts }));
      const local = setlistByUuid.get(uuid);
      if (local?.id != null) {
        await db.setlists.update(local.id, { ...fields, uuid, songs });
        updated++;
      } else {
        await db.setlists.add({ ...fields, uuid, songs } as DBSetlist);
        added++;
      }
    }

    // Prune only what the publisher used to have and has now removed
    const libSetlistUuids = new Set(library.setlists.map((s) => s.uuid));
    const goneSongs = (prev?.songUuids ?? []).filter((u) => !libUuids.has(u));
    const goneSetlists = (prev?.setlistUuids ?? []).filter((u) => !libSetlistUuids.has(u));
    for (const u of goneSongs) {
      removed += await db.songs.where('uuid').equals(u).delete();
    }
    for (const u of goneSetlists) {
      removed += await db.setlists.where('uuid').equals(u).delete();
    }
    // Setlists may still point at pruned songs
    if (goneSongs.length) {
      const existingIds = new Set((await db.songs.toCollection().primaryKeys()) as number[]);
      for (const sl of await db.setlists.toArray()) {
        const kept = sl.songs.filter((e) => existingIds.has(e.songId));
        if (kept.length !== sl.songs.length) await db.setlists.update(sl.id!, { songs: kept });
      }
    }

    const state: LibraryState = {
      publishedAt: library.publishedAt,
      songUuids: library.songs.map((s) => s.uuid),
      setlistUuids: library.setlists.map((s) => s.uuid),
    };
    await db.settings.put({ key: LIBRARY_STATE_KEY, value: state });
  });

  return { added, updated, removed, skipped: false };
}

// Pull the published library from a folder, if it holds one. Returns null when there is none.
export async function pullLibraryFromFolder(
  folderId: string,
  accessToken?: string,
  apiKey?: string,
  resourceKey?: string
): Promise<Awaited<ReturnType<typeof importLibrary>> | null> {
  const file = await findLibraryFile(folderId, accessToken, apiKey, resourceKey);
  if (!file) return null;
  const raw = await fetchDriveFileContent(file.id, accessToken, apiKey, 'application/json', resourceKey);
  const data = JSON.parse(raw);
  if (!isLibrary(data)) {
    throw new Error(`${LIBRARY_FILE_NAME} is not a valid StageChord library (unsupported format or version).`);
  }
  return importLibrary(data);
}

// ---------------------------------------------------------------------------
// Single-setlist publish / pull: one <name>.stagechord-setlist.json holding the setlist and
// its songs. Pulling never touches library songs: every song arrives as a setlist-specific
// copy (forkedFrom set), so re-pulling updates the same copies.
// ---------------------------------------------------------------------------

export const SETLIST_FILE_SUFFIX = '.stagechord-setlist.json';

export interface SetlistBundle {
  format: 'stagechord-setlist';
  version: 1;
  publishedAt: number;
  setlist: LibrarySetlist;
  songs: LibrarySong[];
}

function isSetlistBundle(data: any): data is SetlistBundle {
  return (
    data &&
    data.format === 'stagechord-setlist' &&
    data.version === 1 &&
    data.setlist &&
    Array.isArray(data.setlist.songs) &&
    Array.isArray(data.songs)
  );
}

function setlistFileName(name: string): string {
  const safe = name.replace(/[\\/:*?"<>|']/g, '_').trim() || 'setlist';
  return `${safe}${SETLIST_FILE_SUFFIX}`;
}

export async function buildSetlistBundle(setlistId: number): Promise<SetlistBundle> {
  await ensureUuids();
  const setlist = await db.setlists.get(setlistId);
  if (!setlist) throw new Error('Setlist not found');
  const songs = await db.songs.bulkGet(setlist.songs.map((e) => e.songId));
  const uuidById = new Map<number, string>();
  const libSongs: LibrarySong[] = [];
  for (const s of songs) {
    if (!s || uuidById.has(s.id!)) continue;
    uuidById.set(s.id!, s.uuid!);
    const { id: _id, driveModifiedTime: _d, isFavorite: _f, uuid, ...rest } = s;
    libSongs.push({ ...rest, uuid: uuid! });
  }
  const { id: _sid, uuid, songs: entries, ...fields } = setlist;
  return {
    format: 'stagechord-setlist',
    version: 1,
    publishedAt: Date.now(),
    setlist: {
      ...fields,
      uuid: uuid!,
      songs: entries
        .filter((e) => uuidById.has(e.songId))
        .map(({ songId, ...opts }) => ({ songUuid: uuidById.get(songId)!, ...opts })),
    },
    songs: libSongs,
  };
}

export async function publishSetlistToDrive(params: {
  setlistId: number;
  folderId: string;
  accessToken: string;
}): Promise<{ songs: number; name: string }> {
  const { setlistId, folderId, accessToken } = params;
  const bundle = await buildSetlistBundle(setlistId);
  const fileName = setlistFileName(bundle.setlist.name);

  const q = encodeURIComponent(`'${folderId}' in parents and name = '${fileName.replace(/'/g, "\\'")}' and trashed = false`);
  const found = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id)&pageSize=1`,
    { headers: authHeaders(accessToken) }
  );
  if (!found.ok) throw new Error(`Failed to look for ${fileName} (${found.status}): ${await found.text()}`);
  const existing: { id: string } | undefined = (await found.json()).files?.[0];

  const boundary = `stagechord-${newUuid()}`;
  const metadata: Record<string, unknown> = { name: fileName, mimeType: 'application/json' };
  if (!existing) metadata.parents = [folderId];
  const body =
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(bundle)}\r\n` +
    `--${boundary}--`;
  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart&supportsAllDrives=true`
    : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true`;
  const res = await fetch(url, {
    method: existing ? 'PATCH' : 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': `multipart/related; boundary=${boundary}` },
    body,
  });
  if (!res.ok) throw new Error(`Failed to publish setlist (${res.status}): ${await res.text()}`);
  return { songs: bundle.songs.length, name: bundle.setlist.name };
}

// Setlist files in a folder. Under drive.file this may come back empty for files the app
// did not create; callers then fall back to the Picker.
export async function listSetlistFiles(folderId: string, accessToken: string): Promise<DriveFileItem[]> {
  const q = encodeURIComponent(
    `'${folderId}' in parents and name contains '${SETLIST_FILE_SUFFIX}' and trashed = false`
  );
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType,modifiedTime)&pageSize=100`,
    { headers: authHeaders(accessToken) }
  );
  if (!res.ok) throw new Error(`Failed to list setlists (${res.status}): ${await res.text()}`);
  return ((await res.json()).files ?? []).filter((f: DriveFileItem) => f.name.endsWith(SETLIST_FILE_SUFFIX));
}

export async function importSetlistBundle(bundle: SetlistBundle): Promise<{ name: string; added: number; updated: number }> {
  let added = 0;
  let updated = 0;
  await db.transaction('rw', db.songs, db.setlists, async () => {
    await ensureUuids();
    const byUuid = new Map<string, DBSong>();
    for (const s of await db.songs.toArray()) byUuid.set(s.uuid!, s);

    const setlistUuid = bundle.setlist.uuid;
    const idByOrigUuid = new Map<string, number>();
    for (const ls of bundle.songs) {
      const { uuid: origUuid, ...fields } = ls;
      // Already-forked songs keep their own identity; library songs become copies scoped to this setlist
      const uuid = ls.forkedFrom ? origUuid : `${setlistUuid}:${origUuid}`;
      const data = { ...fields, uuid, forkedFrom: ls.forkedFrom ?? origUuid };
      const local = byUuid.get(uuid);
      if (local?.id != null) {
        if (local.updatedAt !== ls.updatedAt || local.content !== ls.content) {
          await db.songs.update(local.id, data);
          updated++;
        }
        idByOrigUuid.set(origUuid, local.id);
      } else {
        idByOrigUuid.set(origUuid, await db.songs.add({ ...data, isFavorite: false } as DBSong));
        added++;
      }
    }

    const { uuid, songs: entries, ...fields } = bundle.setlist;
    const songs = entries
      .filter((e) => idByOrigUuid.has(e.songUuid))
      .map(({ songUuid, ...opts }) => ({ songId: idByOrigUuid.get(songUuid)!, ...opts }));
    const local = await db.setlists.where('uuid').equals(uuid).first();
    if (local?.id != null) {
      await db.setlists.update(local.id, { ...fields, songs });
    } else {
      await db.setlists.add({ ...fields, uuid, songs } as DBSetlist);
    }
  });
  return { name: bundle.setlist.name, added, updated };
}

export async function pullSetlistFile(fileId: string, accessToken?: string, apiKey?: string) {
  const raw = await fetchDriveFileContent(fileId, accessToken, apiKey, 'application/json');
  const data = JSON.parse(raw);
  if (!isSetlistBundle(data)) throw new Error('This file is not a valid StageChord setlist.');
  const result = await importSetlistBundle(data);
  // Remember it so the next app open can refresh this setlist without a sign-in
  const config = loadDriveConfig();
  const ids = config.pulledSetlistFileIds ?? [];
  if (!ids.includes(fileId)) saveDriveConfig({ ...config, pulledSetlistFileIds: [...ids, fileId] });
  return result;
}

// Silent refresh on app open: re-pull the published library and any setlists pulled before.
// Only uses the saved API key (no sign-in popup), so folders/files must be shared "Anyone with
// the link". Every failure is swallowed; the user can still pull manually.
export async function autoPullOnOpen(): Promise<{ added: number; updated: number; removed: number }> {
  const total = { added: 0, updated: 0, removed: 0 };
  const config = loadDriveConfig();
  const apiKey = config.apiKey?.trim();
  if (!apiKey || config.syncMode === 'local' || !navigator.onLine) return total;

  const add = (r: { added: number; updated: number; removed?: number }) => {
    total.added += r.added;
    total.updated += r.updated;
    total.removed += r.removed ?? 0;
  };

  if (config.folderId) {
    try {
      const r = await pullLibraryFromFolder(config.folderId, undefined, apiKey, config.resourceKey);
      if (r && !r.skipped) {
        add(r);
        saveDriveConfig({ ...loadDriveConfig(), lastSyncTime: Date.now() });
      }
    } catch (e) {
      console.warn('Auto-pull of library failed:', e);
    }
  }

  for (const id of config.pulledSetlistFileIds ?? []) {
    try {
      add(await pullSetlistFile(id, undefined, apiKey));
    } catch (e) {
      console.warn('Auto-pull of setlist failed:', e);
    }
  }
  return total;
}

// Core Sync Engine: Synchronizes Drive folder files into local IndexedDB
export async function syncGoogleDriveFolder(params: {
  folderId: string;
  resourceKey?: string;
  accessToken?: string;
  apiKey?: string;
  folderName?: string;
  // Explicit files to sync (picked via the Picker) instead of listing a folder
  files?: DriveFileItem[];
  onProgress?: (current: number, total: number, fileName: string) => void;
}): Promise<{ added: number; updated: number; skipped: number; total: number }> {
  const { folderId, resourceKey, accessToken, apiKey, folderName = 'Google Drive', files, onProgress } = params;

  // 1. Scan all files in remote folder (includes .cho, .crd, .txt, and Google Docs)
  const remoteFiles = files ?? (await fetchDriveFolderFiles(folderId, accessToken, apiKey, resourceKey));
  const total = remoteFiles.length;

  let added = 0;
  let updated = 0;
  let skipped = 0;

  // A published library (songs + setlists) in the folder is pulled first; chord files are still
  // synced below so folders that hold plain .cho files keep working.
  if (!files) {
    try {
      const lib = await pullLibraryFromFolder(folderId, accessToken, apiKey, resourceKey);
      if (lib && !lib.skipped) {
        added += lib.added;
        updated += lib.updated;
      }
    } catch (err) {
      console.error('Failed to pull published library:', err);
    }
  }

  // 2. Fetch all existing local songs to check for duplicates / updates
  const existingSongs = await db.songs.toArray();
  const existingMap = new Map<string, DBSong>();
  for (const s of existingSongs) {
    if (s.fileName) {
      existingMap.set(s.fileName, s);
    }
  }

  // 3. Download and parse only files that are new or changed since the last sync
  //    (Drive's modifiedTime lets us skip re-fetching content for unchanged files)
  for (let i = 0; i < total; i++) {
    const file = remoteFiles[i];
    onProgress?.(i + 1, total, file.name);

    const existing = existingMap.get(file.name);

    if (existing && existing.driveModifiedTime && file.modifiedTime && existing.driveModifiedTime === file.modifiedTime) {
      skipped++;
      continue;
    }

    try {
      const rawContent = await fetchDriveFileContent(file.id, accessToken, apiKey, file.mimeType, resourceKey);
      const parsed = parseChordPro(rawContent);

      const title = parsed.metadata.title || file.name.replace(/\.[^/.]+$/, '');
      const artist = parsed.metadata.artist || '';
      const key = parsed.metadata.key || 'C';
      const capo = parsed.metadata.capo || 0;
      const tempo = parsed.metadata.tempo || '';
      const time = parsed.metadata.time || '4/4';

      if (existing && existing.id) {
        // Update existing song
        await db.songs.update(existing.id, {
          title,
          artist,
          key,
          originalKey: key,
          capo,
          tempo,
          timeSignature: time,
          content: rawContent,
          folderName,
          fileName: file.name,
          driveModifiedTime: file.modifiedTime,
          updatedAt: Date.now(),
        });
        updated++;
      } else {
        // Add new song
        const newSong: Omit<DBSong, 'id'> = {
          title,
          artist,
          key,
          originalKey: key,
          capo,
          tempo,
          timeSignature: time,
          content: rawContent,
          folderName,
          fileName: file.name,
          driveModifiedTime: file.modifiedTime,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isFavorite: false,
        };
        await db.songs.add(newSong as DBSong);
        added++;
      }
    } catch (err) {
      console.error(`Failed to sync file ${file.name}:`, err);
    }
  }

  return { added, updated, skipped, total };
}

// One-click re-sync using whatever folder/credentials were saved from a previous setup.
// Used by the header/sidebar "Sync Now" quick action so returning users don't have to
// re-open the full modal and re-scan every time.
export async function quickSyncFromSavedConfig(
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<{ added: number; updated: number; skipped: number; total: number }> {
  const config = loadDriveConfig();
  if (!config.folderId) {
    throw new Error('No Google Drive folder is configured yet.');
  }
  if (config.syncMode === 'local') {
    throw new Error('Local/Files App folders don\'t support quick sync — use the folder picker.');
  }

  let accessToken: string | undefined;
  if (config.syncMode === 'oauth') {
    if (!config.clientId) {
      throw new Error('No OAuth Client ID is saved — reconnect via the Google Drive modal.');
    }
    accessToken = await requestDriveAccessToken(config.clientId);
  }

  const result = await syncGoogleDriveFolder({
    folderId: config.folderId,
    resourceKey: config.resourceKey,
    accessToken,
    apiKey: config.syncMode === 'public' ? config.apiKey : undefined,
    folderName: config.folderName,
    onProgress,
  });

  // Also refresh every setlist that was pulled before (songs + order), using the same credentials
  const apiKey = config.apiKey?.trim() || undefined;
  for (const id of config.pulledSetlistFileIds ?? []) {
    try {
      const r = await pullSetlistFile(id, accessToken, accessToken ? undefined : apiKey);
      result.added += r.added;
      result.updated += r.updated;
    } catch (err) {
      console.warn('Sync of pulled setlist failed:', err);
    }
  }

  saveDriveConfig({ ...loadDriveConfig(), lastSyncTime: Date.now() });
  return result;
}
