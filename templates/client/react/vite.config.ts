import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    // strictPort matters: if Vite silently moved to another port, the .NET side
    // would keep redirecting to the port configured in SpaProxyServerUrl.
    port: __CLIENT_PORT__,
    strictPort: true,
    proxy: {
      // The browser always talks to the API through this proxy, which is what
      // makes the coupled and decoupled setups behave identically in development.
      '/api': {
        target: '__API_URL__',
        changeOrigin: true,
        // The ASP.NET Core development certificate is not trusted by Node.
        secure: false,
      },
    },
  },
});
