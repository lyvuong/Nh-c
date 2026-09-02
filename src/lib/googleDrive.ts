import { db, type DBSong } from './db';
import { parseChordPro } from './chordParser';

export interface GoogleDriveConfig {
  clientId?: string;
  apiKey?: string;
  folderId?: string;
  folderName?: string;
  folderUrl?: string;
  resourceKey?: string;
  lastSyncTime?: number;
  syncMode?: 'oauth' | 'public' | 'local';
  autoSyncOnLoad?: boolean;
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

// Open native Google Drive visual Picker modal dialog
export async function showDrivePicker(options: {
  accessToken: string;
  apiKey?: string;
  onSelected: (item: { id: string; name: string; isFolder: boolean; mimeType: string }) => void;
}): Promise<void> {
  await loadGooglePickerScript();
  const google = (window as any).google;
  if (!google?.picker) {
    throw new Error('Google Picker library could not be initialized');
  }

  // Allow selecting folders and Docs / text files
  const docsView = new google.picker.DocsView()
    .setIncludeFolders(true)
    .setSelectFolderEnabled(true);

  const builder = new google.picker.PickerBuilder()
    .addView(docsView)
    .addView(google.picker.ViewId.FOLDERS)
    .setOAuthToken(options.accessToken)
    .setCallback((data: any) => {
      if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
        const doc = data[google.picker.Response.DOCUMENTS][0];
        const isFolder = doc.mimeType === 'application/vnd.google-apps.folder';
        options.onSelected({
          id: doc.id,
          name: doc.name,
          isFolder,
          mimeType: doc.mimeType,
        });
      }
    });

  if (options.apiKey) {
    builder.setDeveloperKey(options.apiKey);
  }

  const picker = builder.build();
  picker.setVisible(true);
}

// Request OAuth Access Token
export async function requestDriveAccessToken(clientId: string): Promise<string> {
  await loadGoogleScript();

  return new Promise((resolve, reject) => {
    const google = (window as any).google;
    if (!google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services library failed to load'));
      return;
    }

    const tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/drive.readonly',
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

// Core Sync Engine: Synchronizes Drive folder files into local IndexedDB
export async function syncGoogleDriveFolder(params: {
  folderId: string;
  resourceKey?: string;
  accessToken?: string;
  apiKey?: string;
  folderName?: string;
  onProgress?: (current: number, total: number, fileName: string) => void;
}): Promise<{ added: number; updated: number; total: number }> {
  const { folderId, resourceKey, accessToken, apiKey, folderName = 'Google Drive', onProgress } = params;

  // 1. Scan all files in remote folder (includes .cho, .crd, .txt, and Google Docs)
  const remoteFiles = await fetchDriveFolderFiles(folderId, accessToken, apiKey, resourceKey);
  const total = remoteFiles.length;

  let added = 0;
  let updated = 0;

  // 2. Fetch all existing local songs to check for duplicates / updates
  const existingSongs = await db.songs.toArray();
  const existingMap = new Map<string, DBSong>();
  for (const s of existingSongs) {
    if (s.fileName) {
      existingMap.set(s.fileName, s);
    }
  }

  // 3. Download and parse each file
  for (let i = 0; i < total; i++) {
    const file = remoteFiles[i];
    onProgress?.(i + 1, total, file.name);

    try {
      const rawContent = await fetchDriveFileContent(file.id, accessToken, apiKey, file.mimeType, resourceKey);
      const parsed = parseChordPro(rawContent);

      const title = parsed.metadata.title || file.name.replace(/\.[^/.]+$/, '');
      const artist = parsed.metadata.artist || '';
      const key = parsed.metadata.key || 'C';
      const capo = parsed.metadata.capo || 0;
      const tempo = parsed.metadata.tempo || '';
      const time = parsed.metadata.time || '4/4';

      const existing = existingMap.get(file.name);

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

  return { added, updated, total };
}

// One-click re-sync using whatever folder/credentials were saved from a previous setup.
// Used by the header/sidebar "Sync Now" quick action so returning users don't have to
// re-open the full modal and re-scan every time.
export async function quickSyncFromSavedConfig(
  onProgress?: (current: number, total: number, fileName: string) => void
): Promise<{ added: number; updated: number; total: number }> {
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

  saveDriveConfig({ ...config, lastSyncTime: Date.now() });
  return result;
}
