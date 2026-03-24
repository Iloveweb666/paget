import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync, existsSync } from 'fs'

export default defineConfig({
  plugins: [
    vue(),
    // 开发模式下提供 bookmarklet 构建产物的静态访问
    // Serve bookmarklet build artifacts in dev mode
    {
      name: 'serve-bookmarklet',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url?.startsWith('/dist/iife/')) {
            const filePath = resolve(__dirname, req.url.slice(1).split('?')[0])
            if (existsSync(filePath)) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8')
              res.setHeader('Access-Control-Allow-Origin', '*')
              res.end(readFileSync(filePath))
              return
            }
          }
          next()
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true,
      },
    },
  },
})
