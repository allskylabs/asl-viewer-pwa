import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import s3DevPlugin from './vite-plugin-s3-dev';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), s3DevPlugin(env)],
  };
});
