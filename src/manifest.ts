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
  action: {
    default_popup: 'options.html',
    default_icon: 'img/logo-48.png',
  },
  content_scripts: [
    {
      matches: ['https://kite.zerodha.com/*'],
      js: ['src/contentScript/index.ts'],
    },
  ],
  options_page: 'options.html',
  web_accessible_resources: [
    {
      resources: ['img/logo-16.png', 'img/logo-34.png', 'img/logo-48.png', 'img/logo-128.png'],
      matches: [],
    },
  ],
  permissions: ['declarativeNetRequest', 'declarativeNetRequestFeedback', 'storage'],
  host_permissions: ['https://console.zerodha.com/*', 'https://kite.zerodha.com/*'],
});
