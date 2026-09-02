/// <reference types="vite/client" />

declare const __APP_VERSION__: string;
declare const __BUILD_DATE__: string;
declare const __BUILD_HASH__: string;
declare const __IS_CLOUDFLARE__: boolean;

interface ImportMetaEnv {
  /** Google API key (Drive API enabled) used to read "Anyone with the link" shared folders without login. */
  readonly VITE_GOOGLE_DRIVE_API_KEY?: string;
  /** Default shared Google Drive folder URL/ID, pre-filled so users don't have to paste it in. */
  readonly VITE_GOOGLE_DRIVE_FOLDER_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
