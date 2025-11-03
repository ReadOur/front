import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 강제 캐시 비활성화
    headers: {
      'Cache-Control': 'no-store',
    },
    // HMR 활성화
    hmr: {
      overlay: true,
    },
    // 파일 감시 설정
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  // 빌드 캐시 비활성화 (개발 중)
  optimizeDeps: {
    force: true,
  },
});
