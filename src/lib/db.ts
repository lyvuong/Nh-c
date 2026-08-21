import Dexie, { type Table } from 'dexie';

export interface DBSong {
  id?: number;
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
  }
}

export const db = new StageChordDatabase();
