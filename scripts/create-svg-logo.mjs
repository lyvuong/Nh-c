import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');

const logoJpgPath = path.join(publicDir, 'logo.jpg');
const logoBase64 = fs.readFileSync(logoJpgPath).toString('base64');

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <defs>
    <clipPath id="squircle-clip">
      <rect x="0" y="0" width="1024" height="1024" rx="224" />
    </clipPath>
  </defs>
  <rect width="1024" height="1024" fill="#0a0d14" />
  <image href="data:image/jpeg;base64,${logoBase64}" x="0" y="0" width="1024" height="1024" preserveAspectRatio="xMidYMid slice" clip-path="url(#squircle-clip)" />
</svg>
`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(publicDir, 'logo.svg'), svgContent, 'utf8');
console.log('Successfully created public/favicon.svg and public/logo.svg from logo.jpg!');
