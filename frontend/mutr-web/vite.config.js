import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isLocal  = mode === 'development'
  const env = loadEnv(mode, path.resolve(__dirname, '../../'), '');

  const localBackendUrl = `http://${env.BACKEND_HOST || 'localhost'}:${env.BACKEND_HOST_PORT || '8080'}`;

  return {
    plugins: [react()],
    server: {
      port: isLocal ? 5173 : (parseInt(env.FRONTEND_HOST_PORT) || 3000),
      proxy: isLocal ? {
        // 로컬에서 /api로 시작하는 요청을 백엔드(8080)로 전달
        '/api': {
          target: localBackendUrl,
          changeOrigin: true,
        },
        // 소셜 로그인 관련 경로도 프록시 설정
        '/oauth2': {
          target: localBackendUrl,
          changeOrigin: true,
        },
        '/ws-mutr': {
          target: localBackendUrl,
          changeOrigin: true,
          ws: true,
        },
      } : {} // 도커(Nginx) 환경에서는 Nginx가 직접 처리하므로 빈 객체
    },
    define: {
      'process.env.FRONTEND_URL': JSON.stringify(
        `http://${env.FRONTEND_HOST || 'localhost'}:${isLocal ? '5173' : (env.FRONTEND_HOST_PORT || '3000')}`
      ),
    }
  };
});