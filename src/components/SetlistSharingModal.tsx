import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  X,
  Cloud,
  Download,
  Upload,
  RefreshCw,
  Link as LinkIcon,
  Copy,
  Share2,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Square,
  ExternalLink,
  FileMusic,
} from 'lucide-react';
import { resolveApiKey, resolveClientId, saveDriveConfig, loadDriveConfig } from '../lib/googleDrive';
import {
  describeSummary,
  getSources,
  listPublishStatuses,
  lookUpFolder,
  publishSetlists,
  pullSetlists,
  removeSource,
  summarizeUpdate,
  type LocalSetlistStatus,
  type PullStatus,
  type RemoteSetlist,
  type Resolution,
  type ShareSource,
  type UpdateSummary,
} from '../lib/setlistSharing';

interface SetlistSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChanged?: () => void;
  onOpenDriveImport: () => void;
}

const PULL_BADGE: Record<PullStatus, { label: string; cls: string }> = {
  new: { label: 'New', cls: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' },
  update: { label: 'Update available', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
  conflict: { label: 'Changed on both sides', cls: 'bg-rose-500/15 border-rose-500/30 text-rose-400' },
  localChanged: { label: 'You edited this copy', cls: 'bg-stage-cardHover border-stage-border text-stage-muted' },
  current: { label: 'Up to date', cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' },
};

const PUBLISH_BADGE = {
  new: { label: 'Not published yet', cls: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400' },
  changed: { label: 'Changed since last publish', cls: 'bg-amber-500/15 border-amber-500/30 text-amber-400' },
  current: { label: 'Published · no changes', cls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500' },
} as const;

const Badge: React.FC<{ label: string; cls: string }> = ({ label, cls }) => (
  <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold whitespace-nowrap ${cls}`}>{label}</span>
);

export const SetlistSharingModal: React.FC<SetlistSharingModalProps> = ({
  isOpen,
  onClose,
  onChanged,
  onOpenDriveImport,
}) => {
  const [tab, setTab] = useState<'get' | 'publish'>('get');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Only shown when the build ships without credentials (self-hosted / dev builds)
  const [apiKeyInput, setApiKeyInput] = useState('');
  const hasApiKey = !!resolveApiKey();
  const hasClientId = !!resolveClientId();

  // --- Get from link ---
  const [link, setLink] = useState('');
  const [sources, setSources] = useState<ShareSource[]>([]);
  const [activeSource, setActiveSource] = useState<ShareSource | null>(null);
  const [remote, setRemote] = useState<RemoteSetlist[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [resolutions, setResolutions] = useState<Record<string, Resolution>>({});
  const [summaries, setSummaries] = useState<Record<string, UpdateSummary | null>>({});

  // --- Publish ---
  const [local, setLocal] = useState<LocalSetlistStatus[]>([]);
  const [ownFolder, setOwnFolder] = useState<{ id: string; name: string; url: string } | undefined>();
  const [toPublish, setToPublish] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);

  const loadPublishList = useCallback(async () => {
    const { setlists, folder } = await listPublishStatuses();
    setLocal(setlists);
    setOwnFolder(folder);
    setToPublish(new Set(setlists.filter((s) => s.status !== 'current').map((s) => s.id)));
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setMessage(null);
    getSources().then(setSources);
    loadPublishList();
  }, [isOpen, loadPublishList]);

  const showRemote = useCallback(async (source: ShareSource, list: RemoteSetlist[]) => {
    setActiveSource(source);
    setRemote(list);
    setPicked(new Set(list.filter((s) => s.status === 'new' || s.status === 'update').map((s) => s.file.id)));
    setResolutions(Object.fromEntries(list.filter((s) => s.status === 'conflict' || s.status === 'localChanged').map((s) => [s.file.id, 'copy' as Resolution])));
    setSummaries({});
    // Describe what changed for the ones with a newer published version
    for (const s of list.filter((x) => x.status === 'update' || x.status === 'conflict')) {
      summarizeUpdate(s.file, source.resourceKey)
        .then((sum) => setSummaries((prev) => ({ ...prev, [s.file.id]: sum })))
        .catch(() => {});
    }
  }, []);

  const findSetlists = async (target?: string) => {
    setError(null);
    setMessage(null);
    const url = (target ?? link).trim();
    if (!url) return;
    if (!hasApiKey && apiKeyInput.trim()) saveDriveConfig({ ...loadDriveConfig(), apiKey: apiKeyInput.trim() });
    try {
      setBusy(true);
      const { source, setlists } = await lookUpFolder(url, apiKeyInput);
      setSources(await getSources());
      await showRemote(source, setlists);
      if (setlists.length === 0) {
        setError('No setlists found in that folder. Check that it is shared as "Anyone with the link".');
      }
    } catch (e: any) {
      setError(e.message || 'Could not read that folder.');
    } finally {
      setBusy(false);
    }
  };

  const pullPicked = async () => {
    if (!activeSource) return;
    setError(null);
    setMessage(null);
    const items = remote
      .filter((s) => picked.has(s.file.id))
      .map((s) => ({
        file: s.file,
        resolution: (s.status === 'conflict' || s.status === 'localChanged' ? resolutions[s.file.id] ?? 'copy' : 'overwrite') as Resolution,
      }));
    try {
      setBusy(true);
      const r = await pullSetlists(activeSource, items);
      onChanged?.();
      await findSetlists(activeSource.url);
      setMessage(
        r.pulled ? `Pulled ${r.pulled} setlist${r.pulled > 1 ? 's' : ''}: ${r.names.join(', ')}. Your library songs were not changed.` : 'Nothing to pull.'
      );
      await loadPublishList();
    } catch (e: any) {
      setError(e.message || 'Pull failed.');
    } finally {
      setBusy(false);
    }
  };

  const publishPicked = async () => {
    setError(null);
    setMessage(null);
    try {
      setBusy(true);
      const r = await publishSetlists([...toPublish]);
      setMessage(`Published ${r.published.length} setlist${r.published.length === 1 ? '' : 's'} to "${r.folder.name}".`);
      await loadPublishList();
    } catch (e: any) {
      setError(e.message || 'Publish failed.');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    if (!ownFolder) return;
    try {
      await navigator.clipboard.writeText(ownFolder.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(`Copy failed. Your link is: ${ownFolder.url}`);
    }
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const shareLink = async () => {
    if (!ownFolder) return;
    try {
      await navigator.share({
        title: 'StageChord setlists',
        text: 'Here are my StageChord setlists. Paste this link under Share → Get from link:',
        url: ownFolder.url,
      });
    } catch (e: any) {
      // Closing the share sheet is not an error
      if (e?.name !== 'AbortError') copyLink();
    }
  };

  const toggle = <T,>(set: Set<T>, v: T, setter: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    setter(next);
  };

  const pendingConflict = useMemo(
    () => remote.some((s) => picked.has(s.file.id) && (s.status === 'conflict' || s.status === 'localChanged')),
    [remote, picked]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="bg-stage-card border border-stage-border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-stage-border flex items-center justify-between bg-stage-bg/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stage-text">Share Setlists</h3>
              <p className="text-xs text-stage-muted">Get setlists from a link, or publish yours for others</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-stage-cardHover text-stage-muted hover:text-stage-text transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stage-border bg-stage-bg/40 px-4 pt-2 gap-2 text-xs font-semibold">
          {(
            [
              ['get', 'Get from link', Download],
              ['publish', 'Publish mine', Upload],
            ] as const
          ).map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition cursor-pointer ${
                tab === id ? 'border-stage-accent text-stage-accent font-bold' : 'border-transparent text-stage-muted hover:text-stage-text'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {message && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="font-bold text-[11px]">{message}</p>
            </div>
          )}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] break-words min-w-0">{error}</p>
            </div>
          )}

          {tab === 'get' && (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="font-mono font-bold text-stage-muted uppercase tracking-wider block">Shared folder link</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && findSetlists()}
                    placeholder="https://drive.google.com/drive/folders/…"
                    className="flex-1 min-w-0 h-10 px-3 rounded-xl bg-stage-bg border border-stage-border text-stage-text placeholder:text-stage-muted font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stage-accent"
                  />
                  <button
                    onClick={() => findSetlists()}
                    disabled={busy || !link.trim()}
                    className="px-4 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50 flex-shrink-0"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                    <span>Find</span>
                  </button>
                </div>
                <p className="text-[11px] text-stage-muted">No sign-in needed. Ask the person sharing for their folder link.</p>
              </div>

              {!hasApiKey && (
                <div className="space-y-1">
                  <label className="font-mono text-[11px] text-stage-muted block">Google API key (this build has none built in)</label>
                  <input
                    type="text"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    placeholder="AIzaSy…"
                    className="w-full h-9 px-3 rounded-lg bg-stage-bg border border-stage-border text-stage-text font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-stage-accent"
                  />
                </div>
              )}

              {sources.length > 0 && (
                <div className="space-y-1.5">
                  <p className="font-mono font-bold text-stage-muted uppercase tracking-wider">Your links</p>
                  <div className="flex flex-wrap gap-1.5">
                    {sources.map((s) => (
                      <span
                        key={s.folderId}
                        className={`inline-flex items-center rounded-lg border text-[11px] ${
                          activeSource?.folderId === s.folderId ? 'border-stage-accent text-stage-accent' : 'border-stage-border text-stage-text'
                        }`}
                      >
                        <button
                          disabled={busy}
                          onClick={() => {
                            setLink(s.url);
                            findSetlists(s.url);
                          }}
                          className="px-2.5 py-1.5 flex items-center gap-1.5 cursor-pointer"
                        >
                          <LinkIcon className="w-3 h-3" />
                          <span className="font-mono">…{s.folderId.slice(-6)}</span>
                          {s.lastChecked && <span className="text-stage-muted">{new Date(s.lastChecked).toLocaleDateString()}</span>}
                        </button>
                        <button
                          aria-label="Forget this link"
                          onClick={async () => {
                            await removeSource(s.folderId);
                            setSources(await getSources());
                            if (activeSource?.folderId === s.folderId) {
                              setActiveSource(null);
                              setRemote([]);
                            }
                          }}
                          className="px-1.5 py-1.5 text-stage-muted hover:text-rose-400 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {remote.length > 0 && (
                <div className="space-y-2">
                  <div className="rounded-xl border border-stage-border bg-stage-bg divide-y divide-stage-border/60">
                    {remote.map((s) => {
                      const on = picked.has(s.file.id);
                      const sum = summaries[s.file.id];
                      const b = PULL_BADGE[s.status];
                      return (
                        <div key={s.file.id} className="p-2.5 space-y-1.5">
                          <div className="flex items-center justify-between gap-2 cursor-pointer" onClick={() => toggle(picked, s.file.id, setPicked)}>
                            <div className="flex items-center gap-2.5 min-w-0">
                              {on ? <CheckSquare className="w-4 h-4 text-cyan-400 flex-shrink-0" /> : <Square className="w-4 h-4 text-stage-muted flex-shrink-0" />}
                              <FileMusic className="w-3.5 h-3.5 text-stage-muted flex-shrink-0" />
                              <span className="font-semibold text-xs text-stage-text truncate">{s.displayName}</span>
                            </div>
                            <Badge {...b} />
                          </div>
                          {(s.status === 'update' || s.status === 'conflict') && sum && (
                            <p className="pl-9 text-[11px] text-stage-muted">What changed: {describeSummary(sum)}</p>
                          )}
                          {(s.status === 'conflict' || s.status === 'localChanged') && on && (
                            <div className="pl-9 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-stage-text">
                              {(
                                [
                                  ['copy', 'Save as a separate copy'],
                                  ['overwrite', 'Replace mine with theirs'],
                                  ['skip', 'Keep mine'],
                                ] as const
                              ).map(([v, label]) => (
                                <label key={v} className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`res-${s.file.id}`}
                                    checked={(resolutions[s.file.id] ?? 'copy') === v}
                                    onChange={() => setResolutions((r) => ({ ...r, [s.file.id]: v }))}
                                  />
                                  {label}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {pendingConflict && (
                    <p className="text-[11px] text-rose-400">You edited some of these copies. Choose what to do with each one above.</p>
                  )}
                  <div className="flex justify-end">
                    <button
                      onClick={pullPicked}
                      disabled={busy || picked.size === 0}
                      className="px-5 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      <span>Pull selected ({picked.size})</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'publish' && (
            <div className="space-y-3.5">
              <div className="p-3.5 rounded-xl bg-stage-bg border border-stage-border space-y-2">
                <p className="font-bold text-stage-text">Your share link</p>
                {ownFolder ? (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <input
                        readOnly
                        value={ownFolder.url}
                        onFocus={(e) => e.currentTarget.select()}
                        className="flex-1 min-w-[12rem] h-9 px-3 rounded-lg bg-stage-card border border-stage-border text-stage-text font-mono text-[11px]"
                      />
                      <button
                        onClick={copyLink}
                        className="px-3 h-9 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                      >
                        {copied ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy link'}</span>
                      </button>
                      {canShare && (
                        <button
                          onClick={shareLink}
                          className="px-3 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
                      )}
                      <a
                        href={ownFolder.url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Open folder in Drive"
                        className="px-2.5 h-9 rounded-lg bg-stage-card border border-stage-border text-stage-muted hover:text-stage-text flex items-center flex-shrink-0"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    <p className="text-[11px] text-stage-muted">
                      Send this link to anyone. They paste it under “Get from link”. The link stays the same when you publish updates.
                    </p>
                  </>
                ) : (
                  <p className="text-[11px] text-stage-muted">
                    The first time you publish, a “StageChord Setlists” folder is created in your Google Drive and shared as “Anyone with the link can view”. Then you can copy its link here.
                  </p>
                )}
              </div>

              {!hasClientId && (
                <p className="text-[11px] text-rose-400">Publishing isn’t set up in this build (no Google Client ID).</p>
              )}

              {local.length === 0 ? (
                <p className="text-stage-muted">You have no setlists yet.</p>
              ) : (
                <div className="space-y-2">
                  <div className="rounded-xl border border-stage-border bg-stage-bg divide-y divide-stage-border/60">
                    {local.map((s) => {
                      const on = toPublish.has(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => toggle(toPublish, s.id, setToPublish)}
                          className="p-2.5 flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {on ? <CheckSquare className="w-4 h-4 text-cyan-400 flex-shrink-0" /> : <Square className="w-4 h-4 text-stage-muted flex-shrink-0" />}
                            <div className="min-w-0">
                              <p className="font-semibold text-xs text-stage-text truncate">{s.name}</p>
                              <p className="text-[10px] text-stage-muted">
                                {s.songCount} songs{s.publishedAt ? ` · published ${new Date(s.publishedAt).toLocaleString()}` : ''}
                              </p>
                            </div>
                          </div>
                          <Badge {...PUBLISH_BADGE[s.status]} />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={publishPicked}
                      disabled={busy || toPublish.size === 0 || !hasClientId}
                      className="px-5 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{busy ? 'Publishing…' : `Publish selected (${toPublish.size})`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-stage-border bg-stage-bg/40 flex items-center justify-between text-[11px] text-stage-muted">
          <button
            onClick={() => {
              onClose();
              onOpenDriveImport();
            }}
            className="text-stage-accent hover:underline font-semibold cursor-pointer"
          >
            Import chord files from Drive…
          </button>
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg bg-stage-cardHover hover:bg-stage-border text-stage-text font-bold transition">
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
