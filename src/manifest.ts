import {defineManifest} from '@crxjs/vite-plugin';
import packageData from '../package.json';

export default defineManifest({
  name: packageData.name,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: 'img/logo-16.png',
    32: 'img/logo-34.png',
    48: 'img/logo-48.png',
    128: 'img/logo-128.png',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  content_scripts: [
    {
      matches: ['https://kite.zerodha.com/*'],
      js: ['src/contentScript/index.ts'],
    },
    {
      matches: ['https://console.zerodha.com/*'],
      all_frames: true,
      js: ['src/contentScript/console/index.ts'],
    },
  ],
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-34.png', 'img/logo-48.png', 'img/logo-128.png'],
      matches: [],
    },
  ],
  permissions: ['declarativeNetRequest', 'declarativeNetRequestFeedback'],
  host_permissions: ['https://console.zerodha.com/*', 'https://kite.zerodha.com/*'],
});
