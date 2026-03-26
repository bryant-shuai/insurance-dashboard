import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'html-cache-busting',
      transformIndexHtml(html) {
        // 在 index.html 中添加 meta 标签禁用缓存，并注入版本号
        const version = new Date().getTime()
        return html.replace(
          '<head>',
          `<head>\n    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n    <meta http-equiv="Pragma" content="no-cache">\n    <meta http-equiv="Expires" content="0">\n    <meta name="build-version" content="${version}">`
        )
      }
    }
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
