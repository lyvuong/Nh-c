import Dexie, { type Table } from 'dexie';

export interface DBSong {
  id?: number;
  uuid?: string; // Stable cross-device identity, used by library publish/sync
  title: string;
  artist?: string;
  key?: string;
  originalKey?: string;
  capo?: number;
  tempo?: string;
  timeSignature?: string;
  content: string; // Raw ChordPro content
  tags?: string[];
  folderName?: string;
  fileName?: string;
  driveModifiedTime?: string;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
}

export interface DBSetlistSong {
  songId: number;
  customKey?: string;
  customCapo?: number;
  notes?: string;
}

export interface DBSetlist {
  id?: number;
  uuid?: string; // Stable cross-device identity, used by library publish/sync
  name: string;
  description?: string;
  songs: DBSetlistSong[];
  gigDate?: string;
  createdAt: number;
  updatedAt: number;
}

export interface DBSetting {
  key: string;
  value: any;
}

export class StageChordDatabase extends Dexie {
  songs!: Table<DBSong, number>;
  setlists!: Table<DBSetlist, number>;
  settings!: Table<DBSetting, string>;

  constructor() {
    super('StageChordDB');
    this.version(1).stores({
      songs: '++id, title, artist, key, folderName, createdAt, updatedAt, isFavorite',
      setlists: '++id, name, gigDate, createdAt, updatedAt',
      settings: 'key',
    });
    // v2: stable uuid per song / setlist so a published library can be merged across devices
    this.version(2)
      .stores({
        songs: '++id, uuid, title, artist, key, folderName, createdAt, updatedAt, isFavorite',
        setlists: '++id, uuid, name, gigDate, createdAt, updatedAt',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await tx.table('songs').toCollection().modify((s) => {
          if (!s.uuid) s.uuid = newUuid();
        });
        await tx.table('setlists').toCollection().modify((s) => {
          if (!s.uuid) s.uuid = newUuid();
        });
      });
    // Any song / setlist created without an explicit uuid (folder import, Drive sync, UI) gets one here
    this.songs.hook('creating', (_pk, obj) => {
      if (!obj.uuid) obj.uuid = newUuid();
    });
    this.setlists.hook('creating', (_pk, obj) => {
      if (!obj.uuid) obj.uuid = newUuid();
    });
  }
}

export function newUuid(): string {
  return crypto.randomUUID();
}

export const db = new StageChordDatabase();
