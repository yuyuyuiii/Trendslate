import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Trendslate',
    permissions: ['storage', 'activeTab'],
    host_permissions: [
      'https://github.com/trending*',
      'https://api-free.deepl.com/*',
    ],
  },
});
