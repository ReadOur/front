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
    // 프록시 설정: CORS 문제 해결
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure(proxy) {
          proxy.on('proxyReq', (_req, req) => {
            console.log('➡️ [ProxyReq]', req.method, req.url);
          });
          proxy.on('proxyRes', (res, req) => {
            console.log('✅ [ProxyRes]', req.method, req.url, res.statusCode);
          });
        },
      },
      '/chat': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure(proxy) {
          proxy.on('proxyReq', (_req, req) => {
            console.log('➡️ [ProxyReq] Chat', req.method, req.url);
          });
          proxy.on('proxyRes', (res, req) => {
            console.log('✅ [ProxyRes] Chat', req.method, req.url, res.statusCode);
          });
        },
      },
    },
    // 강제 캐시 비활성화 (더 강력하게)
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
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
