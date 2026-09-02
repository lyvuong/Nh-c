import React, { useState, useEffect } from 'react';
import { 
  X, 
  Cloud, 
  RefreshCw, 
  Link as LinkIcon, 
  Key, 
  FolderOpen, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  Smartphone, 
  HardDrive,
  FileText,
  Music,
  CheckSquare,
  Square,
  Search,
  Download
} from 'lucide-react';
import { 
  loadDriveConfig, 
  saveDriveConfig, 
  extractFolderInfo, 
  requestDriveAccessToken, 
  fetchDriveFolderName, 
  fetchDriveFolderFiles,
  fetchDriveFileContent,
  showDrivePicker,
  type GoogleDriveConfig,
  type DriveFileItem
} from '../lib/googleDrive';
import { db, type DBSong } from '../lib/db';
import { parseChordPro } from '../lib/chordParser';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenFolderImport: () => void;
  onSyncCompleted?: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  onOpenFolderImport,
  onSyncCompleted,
}) => {
  const [config, setConfig] = useState<GoogleDriveConfig>(loadDriveConfig());
  const [activeTab, setActiveTab] = useState<'oauth' | 'public' | 'local'>(
    () => loadDriveConfig().syncMode || 'oauth'
  );
  
  // Inputs
  const [folderInput, setFolderInput] = useState(config.folderUrl || config.folderId || '');
  const [clientIdInput, setClientIdInput] = useState(config.clientId || '');
  const [apiKeyInput, setApiKeyInput] = useState(config.apiKey || '');
  const [showAdvancedAuth, setShowAdvancedAuth] = useState(false);

  // Scanned Files List state
  const [scannedFiles, setScannedFiles] = useState<DriveFileItem[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [cachedToken, setCachedToken] = useState<string | null>(null);
  const [fileFilterQuery, setFileFilterQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState('');
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const [syncResult, setSyncResult] = useState<{ added: number; updated: number; total: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const current = loadDriveConfig();
      setConfig(current);
      if (current.folderUrl || current.folderId) {
        setFolderInput(current.folderUrl || current.folderId || '');
      }
      if (current.clientId) setClientIdInput(current.clientId);
      if (current.apiKey) setApiKeyInput(current.apiKey);
      if (current.syncMode) setActiveTab(current.syncMode);
      setErrorMessage(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Scan folder and populate interactive song file list
  const handleScanFolder = async () => {
    setErrorMessage(null);
    setSyncResult(null);
    setScannedFiles([]);

    const info = extractFolderInfo(folderInput);
    if (!info || !info.folderId) {
      setErrorMessage('Please enter a valid Google Drive Shared Folder URL or Folder ID');
      return;
    }
    const { folderId, resourceKey } = info;

    try {
      setIsScanning(true);
      setSyncStatusText('Connecting to Google Drive...');

      let token = cachedToken;
      if (activeTab === 'oauth') {
        const clientId = clientIdInput.trim();
        if (!clientId) {
          setErrorMessage('Please provide your Google Cloud OAuth Client ID in the configuration below');
          setShowAdvancedAuth(true);
          setIsScanning(false);
          return;
        }
        if (!token) {
          setSyncStatusText('Requesting Google Account Authorization...');
          token = await requestDriveAccessToken(clientId);
          setCachedToken(token);
        }
      }

      const apiKey = activeTab === 'public' ? apiKeyInput.trim() : undefined;
      setSyncStatusText('Scanning for Google Docs and ChordPro files in folder...');

      const folderName = await fetchDriveFolderName(folderId, token || undefined, apiKey, resourceKey);
      const files = await fetchDriveFolderFiles(folderId, token || undefined, apiKey, resourceKey);

      setScannedFiles(files);
      // Select all files by default
      setSelectedFileIds(new Set(files.map((f) => f.id)));

      const updatedConfig: GoogleDriveConfig = {
        ...config,
        clientId: clientIdInput.trim() || config.clientId,
        apiKey: apiKeyInput.trim() || config.apiKey,
        folderId,
        folderName,
        folderUrl: folderInput,
        resourceKey,
        syncMode: activeTab,
      };
      setConfig(updatedConfig);
      saveDriveConfig(updatedConfig);

      if (files.length === 0) {
        setErrorMessage(`Connected to "${folderName}", but no Google Docs or ChordPro (.cho/.crd/.txt) files were found.`);
      }
    } catch (err: any) {
      console.error('Scan failed:', err);
      setErrorMessage(err.message || 'Failed to scan Google Drive folder');
    } finally {
      setIsScanning(false);
      setSyncStatusText('');
    }
  };

  // Launch Google Picker native popup
  const handleOpenGooglePicker = async () => {
    setErrorMessage(null);
    const clientId = clientIdInput.trim();
    if (!clientId) {
      setErrorMessage('Please provide your Google Cloud OAuth Client ID below to launch the Drive browser');
      setShowAdvancedAuth(true);
      return;
    }

    try {
      let token = cachedToken;
      if (!token) {
        token = await requestDriveAccessToken(clientId);
        setCachedToken(token);
      }

      await showDrivePicker({
        accessToken: token,
        apiKey: apiKeyInput.trim() || undefined,
        onSelected: async (item) => {
          if (item.isFolder) {
            setFolderInput(`https://drive.google.com/drive/folders/${item.id}`);
            // Automatically trigger folder scan
            setTimeout(() => {
              handleScanFolder();
            }, 100);
          } else {
            // Single file picked
            setFolderInput(item.id);
          }
        },
      });
    } catch (err: any) {
      console.error('Google Picker error:', err);
      setErrorMessage(err.message || 'Could not open Google Drive browser');
    }
  };

  // Import Selected Files into IndexedDB
  const handleImportSelected = async () => {
    if (selectedFileIds.size === 0) {
      setErrorMessage('Please select at least one song file to import');
      return;
    }

    const filesToImport = scannedFiles.filter((f) => selectedFileIds.has(f.id));
    const info = extractFolderInfo(folderInput) || (config.folderId ? { folderId: config.folderId, resourceKey: config.resourceKey } : null);
    const folderId = info?.folderId || 'drive';
    const resourceKey = info?.resourceKey || config.resourceKey;
    const folderName = config.folderName || 'Google Drive';

    try {
      setIsSyncing(true);
      const total = filesToImport.length;
      let added = 0;
      let updated = 0;

      const existingSongs = await db.songs.toArray();
      const existingMap = new Map<string, DBSong>();
      for (const s of existingSongs) {
        if (s.fileName) existingMap.set(s.fileName, s);
      }

      const token = cachedToken || undefined;
      const apiKey = activeTab === 'public' ? apiKeyInput.trim() : undefined;

      for (let i = 0; i < total; i++) {
        const file = filesToImport[i];
        setSyncProgress({ current: i + 1, total });
        setSyncStatusText(`Downloading ${i + 1}/${total}: ${file.name}`);

        try {
          const rawContent = await fetchDriveFileContent(file.id, token, apiKey, file.mimeType, resourceKey);
          const parsed = parseChordPro(rawContent);

          const title = parsed.metadata.title || file.name.replace(/\.[^/.]+$/, '');
          const artist = parsed.metadata.artist || '';
          const key = parsed.metadata.key || 'C';
          const capo = parsed.metadata.capo || 0;
          const tempo = parsed.metadata.tempo || '';
          const time = parsed.metadata.time || '4/4';

          const existing = existingMap.get(file.name);

          if (existing && existing.id) {
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
              updatedAt: Date.now(),
            });
            updated++;
          } else {
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
              createdAt: Date.now(),
              updatedAt: Date.now(),
              isFavorite: false,
            };
            await db.songs.add(newSong as DBSong);
            added++;
          }
        } catch (err) {
          console.error(`Failed to process ${file.name}:`, err);
        }
      }

      const updatedConfig: GoogleDriveConfig = {
        ...config,
        folderId,
        folderName,
        folderUrl: folderInput,
        lastSyncTime: Date.now(),
        syncMode: activeTab,
      };
      setConfig(updatedConfig);
      saveDriveConfig(updatedConfig);

      setSyncResult({ added, updated, total });
      onSyncCompleted?.();
    } catch (err: any) {
      console.error('Import failed:', err);
      setErrorMessage(err.message || 'Failed to import files from Google Drive');
    } finally {
      setIsSyncing(false);
      setSyncStatusText('');
    }
  };

  // Toggle single file selection
  const toggleFile = (id: string) => {
    const next = new Set(selectedFileIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFileIds(next);
  };

  // Toggle all files
  const toggleSelectAll = () => {
    if (selectedFileIds.size === scannedFiles.length) {
      setSelectedFileIds(new Set());
    } else {
      setSelectedFileIds(new Set(scannedFiles.map((f) => f.id)));
    }
  };

  // Filtered files view
  const filteredFiles = scannedFiles.filter((f) => 
    f.name.toLowerCase().includes(fileFilterQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stage-card border border-stage-border rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 border-b border-stage-border flex items-center justify-between bg-stage-bg/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-stage-text">
                  Google Drive Cloud Sync
                </h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Google Docs & ChordPro
                </span>
              </div>
              <p className="text-xs text-stage-muted">
                Scan, preview, and select songs directly from your shared Google Drive folder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stage-cardHover text-stage-muted hover:text-stage-text transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stage-border bg-stage-bg/40 px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition flex-shrink-0 cursor-pointer ${
              activeTab === 'oauth'
                ? 'border-stage-accent text-stage-accent font-bold'
                : 'border-transparent text-stage-muted hover:text-stage-text'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Google Account (OAuth)</span>
          </button>

          <button
            onClick={() => setActiveTab('public')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition flex-shrink-0 cursor-pointer ${
              activeTab === 'public'
                ? 'border-stage-accent text-stage-accent font-bold'
                : 'border-transparent text-stage-muted hover:text-stage-text'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Public Shared Link</span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition flex-shrink-0 cursor-pointer ${
              activeTab === 'local'
                ? 'border-stage-accent text-stage-accent font-bold'
                : 'border-transparent text-stage-muted hover:text-stage-text'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Files App / Local Drive</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          
          {/* Sync Progress Banner */}
          {(isSyncing || isScanning) && (
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  {syncStatusText}
                </span>
                {syncProgress.total > 0 && (
                  <span className="font-mono text-xs font-bold">
                    {Math.round((syncProgress.current / syncProgress.total) * 100)}%
                  </span>
                )}
              </div>
              {syncProgress.total > 0 && (
                <div className="w-full h-1.5 bg-stage-bg rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-200" 
                    style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Sync Result Banner */}
          {syncResult && !isSyncing && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-bold">Imported {syncResult.total} Songs Successfully!</p>
                <p className="text-[11px] text-stage-muted mt-0.5">
                  Added {syncResult.added} new songs, updated {syncResult.updated}. All charts are saved locally for offline stage use.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Google Drive Notice</p>
                <p className="text-[11px] text-stage-muted mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* TAB 1: Google Account (OAuth 2.0) */}
          {activeTab === 'oauth' && (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="font-mono font-bold text-stage-muted uppercase tracking-wider block">
                    Shared Google Drive Folder Link or Folder ID
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenGooglePicker}
                    className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    <span>Browse Drive</span>
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={folderInput}
                    onChange={(e) => setFolderInput(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/1abc... or Folder ID"
                    className="flex-1 h-10 px-3 rounded-xl bg-stage-bg border border-stage-border text-stage-text placeholder:text-stage-muted font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stage-accent"
                  />
                  <button
                    type="button"
                    onClick={handleScanFolder}
                    disabled={isScanning || isSyncing}
                    className="px-4 h-10 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50 flex-shrink-0 shadow"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>Scan Files</span>
                  </button>
                </div>
                <p className="text-[11px] text-stage-muted">
                  Paste the shared folder link from your browser or click <strong>Browse Drive</strong> to pick visually.
                </p>
              </div>

              {/* Advanced OAuth Settings */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setShowAdvancedAuth(!showAdvancedAuth)}
                  className="text-xs text-stage-accent hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showAdvancedAuth ? 'rotate-90' : ''}`} />
                  <span>Google Cloud OAuth Client ID Setup</span>
                </button>

                {showAdvancedAuth && (
                  <div className="mt-2 p-3.5 rounded-xl bg-stage-bg/80 border border-stage-border space-y-2 animate-in fade-in duration-150">
                    <label className="font-mono text-[11px] text-stage-muted block">
                      Google OAuth 2.0 Client ID (Web Application)
                    </label>
                    <input
                      type="text"
                      value={clientIdInput}
                      onChange={(e) => setClientIdInput(e.target.value)}
                      placeholder="e.g. 1234567890-abcdefg.apps.googleusercontent.com"
                      className="w-full h-9 px-3 rounded-lg bg-stage-cardHover border border-stage-border text-stage-text font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-stage-accent"
                    />
                    <p className="text-[10px] text-stage-muted leading-relaxed">
                      Created in <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Google Cloud Console <ExternalLink className="inline w-2.5 h-2.5" /></a> with Authorized JavaScript Origins set to your current domain (e.g. <code>https://nhac.pages.dev</code> or <code>http://localhost:5173</code>).
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Public Shared Folder Link */}
          {activeTab === 'public' && (
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="font-mono font-bold text-stage-muted uppercase tracking-wider block">
                  Public Google Drive Folder URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={folderInput}
                    onChange={(e) => setFolderInput(e.target.value)}
                    placeholder="https://drive.google.com/drive/folders/1abc..."
                    className="flex-1 h-10 px-3 rounded-xl bg-stage-bg border border-stage-border text-stage-text placeholder:text-stage-muted font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stage-accent"
                  />
                  <button
                    type="button"
                    onClick={handleScanFolder}
                    disabled={isScanning || isSyncing}
                    className="px-4 h-10 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition active:scale-95 cursor-pointer disabled:opacity-50 flex-shrink-0 shadow"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                    <span>Scan Files</span>
                  </button>
                </div>
                {import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_URL && (
                  <p className="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Pre-filled from app configuration — you shouldn't need to change this.</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="font-mono font-bold text-stage-muted uppercase tracking-wider block">
                  Google API Key (for public folder queries)
                </label>
                <input
                  type="text"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full h-9 px-3 rounded-lg bg-stage-bg border border-stage-border text-stage-text font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-stage-accent"
                />
                {import.meta.env.VITE_GOOGLE_DRIVE_API_KEY && (
                  <p className="text-[10px] text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Pre-filled from app configuration — you shouldn't need to enter one.</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: iPad / Tablet Files App */}
          {activeTab === 'local' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-stage-bg border border-stage-border space-y-2.5">
                <div className="flex items-center gap-2 text-stage-text font-bold text-sm">
                  <HardDrive className="w-4 h-4 text-cyan-400" />
                  <span>Files App / Local Google Drive Mount</span>
                </div>
                
                <p className="text-[11px] text-stage-muted leading-relaxed">
                  Note: Google Docs files (<code>.gdoc</code>) stored in cloud drives are web shortcuts. To import Google Docs directly into Nhạc with all chords parsed, use <strong>Tab 1 (Google Account OAuth)</strong> or <strong>Tab 2 (Public Shared Link)</strong>. For standard <code>.cho</code> / <code>.txt</code> files, use the local folder picker:
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    onClose();
                    onOpenFolderImport();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Open Local Folder Picker</span>
                </button>
              </div>
            </div>
          )}

          {/* Interactive Scanned Files Explorer Table */}
          {scannedFiles.length > 0 && (
            <div className="pt-2 space-y-2 border-t border-stage-border">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stage-text text-xs">
                    Found {scannedFiles.length} Songs in Folder
                  </span>
                  <span className="font-mono text-[10px] text-stage-muted">
                    ({selectedFileIds.size} selected)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleSelectAll}
                    className="text-xs text-stage-accent hover:underline font-semibold cursor-pointer"
                  >
                    {selectedFileIds.size === scannedFiles.length ? 'Deselect All' : 'Select All'}
                  </button>
                </div>
              </div>

              {/* Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stage-muted" />
                <input
                  type="text"
                  value={fileFilterQuery}
                  onChange={(e) => setFileFilterQuery(e.target.value)}
                  placeholder="Filter song titles..."
                  className="w-full h-8 pl-8 pr-3 rounded-lg bg-stage-bg border border-stage-border text-stage-text font-mono text-xs focus:outline-none focus:ring-1 focus:ring-stage-accent"
                />
              </div>

              {/* Songs List */}
              <div className="max-h-52 overflow-y-auto rounded-xl border border-stage-border bg-stage-bg divide-y divide-stage-border/60">
                {filteredFiles.map((file) => {
                  const isSelected = selectedFileIds.has(file.id);
                  const isGDoc = file.mimeType === 'application/vnd.google-apps.document';

                  return (
                    <div
                      key={file.id}
                      onClick={() => toggleFile(file.id)}
                      className={`p-2.5 flex items-center justify-between gap-2 cursor-pointer transition ${
                        isSelected ? 'bg-cyan-500/10 hover:bg-cyan-500/15' : 'hover:bg-stage-cardHover'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-stage-muted flex-shrink-0" />
                        )}
                        
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-stage-text truncate">
                            {file.name}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isGDoc ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400 font-mono text-[10px] font-bold flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            <span>Google Doc</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-bold flex items-center gap-1">
                            <Music className="w-3 h-3" />
                            <span>ChordPro</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button: Import Selected */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={handleImportSelected}
                  disabled={isSyncing || selectedFileIds.size === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 active:scale-95 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
                  <span>Import {selectedFileIds.size} Selected Songs into Library</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-stage-border bg-stage-bg/40 flex items-center justify-between text-[11px] text-stage-muted font-mono">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Saved permanently into IndexedDB for 100% offline gig use</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-stage-cardHover hover:bg-stage-border text-stage-text font-bold transition"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
