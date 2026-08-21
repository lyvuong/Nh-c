import React, { useState, useRef } from 'react';
import { 
  FolderOpen, 
  Check, 
  X, 
  CheckSquare, 
  Square
} from 'lucide-react';
import { parseChordPro } from '../lib/chordParser';
import type { DBSong } from '../lib/db';

interface FolderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSongs: (songs: Omit<DBSong, 'id'>[]) => Promise<void>;
}

interface ScannedFile {
  id: string;
  name: string;
  folderName: string;
  content: string;
  title: string;
  artist?: string;
  key?: string;
  selected: boolean;
  sizeBytes: number;
}

export const FolderImportModal: React.FC<FolderImportModalProps> = ({
  isOpen,
  onClose,
  onImportSongs,
}) => {
  const [scannedFiles, setScannedFiles] = useState<ScannedFile[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [folderName, setFolderName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle native File System Access API (showDirectoryPicker)
  const handleOpenDirectoryPicker = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        setIsScanning(true);
        const dirHandle = await (window as any).showDirectoryPicker();
        setFolderName(dirHandle.name);

        const filesList: ScannedFile[] = [];
        await scanDirectoryEntries(dirHandle, dirHandle.name, filesList);
        setScannedFiles(filesList);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error opening directory:', err);
          fileInputRef.current?.click();
        }
      } finally {
        setIsScanning(false);
      }
    } else {
      fileInputRef.current?.click();
    }
  };

  // Recursively read files from directory handle
  const scanDirectoryEntries = async (
    dirHandle: any,
    currentFolderPath: string,
    results: ScannedFile[]
  ) => {
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file') {
        const ext = entry.name.split('.').pop()?.toLowerCase();
        if (['cho', 'crd', 'pro', 'chordpro', 'txt', 'chopro'].includes(ext || '')) {
          const file = await entry.getFile();
          const text = await file.text();
          const parsed = parseChordPro(text);

          results.push({
            id: `${currentFolderPath}/${entry.name}`,
            name: entry.name,
            folderName: currentFolderPath,
            content: text,
            title: parsed.metadata.title || entry.name.replace(/\.[^/.]+$/, ''),
            artist: parsed.metadata.artist,
            key: parsed.metadata.key,
            selected: true,
            sizeBytes: file.size,
          });
        }
      } else if (entry.kind === 'directory') {
        await scanDirectoryEntries(entry, `${currentFolderPath}/${entry.name}`, results);
      }
    }
  };

  // Fallback for HTML5 webkitdirectory file input
  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsScanning(true);
    const results: ScannedFile[] = [];
    let detectedFolderName = 'Imported Folder';

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (['cho', 'crd', 'pro', 'chordpro', 'txt', 'chopro'].includes(ext || '')) {
        const relPath = file.webkitRelativePath || file.name;
        const pathParts = relPath.split('/');
        const currentFolder = pathParts.length > 1 ? pathParts[0] : 'Root';
        detectedFolderName = currentFolder;

        const text = await file.text();
        const parsed = parseChordPro(text);

        results.push({
          id: relPath,
          name: file.name,
          folderName: currentFolder,
          content: text,
          title: parsed.metadata.title || file.name.replace(/\.[^/.]+$/, ''),
          artist: parsed.metadata.artist,
          key: parsed.metadata.key,
          selected: true,
          sizeBytes: file.size,
        });
      }
    }

    setFolderName(detectedFolderName);
    setScannedFiles(results);
    setIsScanning(false);
  };

  const toggleSelect = (id: string) => {
    setScannedFiles((prev) =>
      prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
    );
  };

  const toggleSelectAll = (select: boolean) => {
    setScannedFiles((prev) => prev.map((f) => ({ ...f, selected: select })));
  };

  const handleConfirmImport = async () => {
    const selected = scannedFiles.filter((f) => f.selected);
    if (selected.length === 0) return;

    setIsImporting(true);
    const songsToImport: Omit<DBSong, 'id'>[] = selected.map((file) => {
      const parsed = parseChordPro(file.content);
      return {
        title: file.title,
        artist: file.artist || parsed.metadata.artist,
        key: file.key || parsed.metadata.key,
        originalKey: file.key || parsed.metadata.key,
        capo: parsed.metadata.capo || 0,
        tempo: parsed.metadata.tempo,
        timeSignature: parsed.metadata.time,
        content: file.content,
        folderName: file.folderName || folderName || 'Imported',
        fileName: file.name,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
      };
    });

    await onImportSongs(songsToImport);
    setIsImporting(false);
    onClose();
  };

  const selectedCount = scannedFiles.filter((f) => f.selected).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <input
        ref={fileInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      <div className="bg-stage-card border border-stage-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-stage-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-stage-text">
                Import ChordPro Song Folder
              </h3>
              <p className="text-xs text-stage-muted">
                Select a folder containing .cho, .crd, .chordpro, or .txt files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stage-cardHover text-stage-muted hover:text-stage-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          {scannedFiles.length === 0 ? (
            <div className="border-2 border-dashed border-stage-border hover:border-stage-accent/60 rounded-2xl p-8 text-center transition flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-stage-cardHover flex items-center justify-center text-stage-accent shadow-inner">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div>
                <p className="font-bold text-sm text-stage-text">
                  Choose Song Directory to Scan
                </p>
                <p className="text-xs text-stage-muted mt-1 max-w-sm">
                  Reads all chord charts inside the selected folder and subfolders. Works 100% offline without uploading anywhere.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleOpenDirectoryPicker}
                  disabled={isScanning}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition flex items-center gap-2"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>{isScanning ? 'Scanning Directory...' : 'Select Local Folder'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Folder Summary Bar */}
              <div className="flex items-center justify-between bg-stage-bg p-3 rounded-xl border border-stage-border">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-amber-400" />
                  <span className="font-bold text-xs text-stage-text">
                    Folder: {folderName}
                  </span>
                  <span className="text-xs text-stage-muted font-mono">
                    ({scannedFiles.length} songs detected)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleSelectAll(true)}
                    className="text-xs text-stage-accent hover:underline font-semibold"
                  >
                    Select All
                  </button>
                  <span className="text-stage-border">|</span>
                  <button
                    onClick={() => toggleSelectAll(false)}
                    className="text-xs text-stage-muted hover:underline"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Scanned Files List */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {scannedFiles.map((file) => (
                  <div
                    key={file.id}
                    onClick={() => toggleSelect(file.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between gap-3 transition ${
                      file.selected
                        ? 'bg-stage-cardHover border-stage-accent/40 text-stage-text'
                        : 'bg-stage-bg/50 border-stage-border/50 text-stage-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {file.selected ? (
                        <CheckSquare className="w-4 h-4 text-stage-accent flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-stage-muted flex-shrink-0" />
                      )}
                      <div className="truncate">
                        <div className="text-xs font-bold truncate text-stage-text">
                          {file.title}
                        </div>
                        <div className="text-[11px] text-stage-muted truncate">
                          {file.name} {file.artist ? `• ${file.artist}` : ''}
                        </div>
                      </div>
                    </div>

                    {file.key && (
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-stage-bg border border-stage-border text-stage-accent">
                        Key: {file.key}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stage-border bg-stage-bg/40 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stage-muted hover:text-stage-text transition"
          >
            Cancel
          </button>

          {scannedFiles.length > 0 && (
            <button
              onClick={handleConfirmImport}
              disabled={selectedCount === 0 || isImporting}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-30 text-white font-extrabold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>
                {isImporting
                  ? 'Importing...'
                  : `Import ${selectedCount} Song${selectedCount === 1 ? '' : 's'}`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
