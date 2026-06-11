import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import s3DevPlugin from './vite-plugin-s3-dev';
import pkg from './package.json';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), s3DevPlugin(env)],
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
  };
});
