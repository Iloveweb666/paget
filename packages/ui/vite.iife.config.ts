/**
 * Bookmarklet IIFE 构建配置
 * Bookmarklet IIFE build configuration
 *
 * 将 UI 打包成单个自执行 JS 文件，用于通过书签栏注入到任意页面
 * Bundles UI into a single self-executing JS file for injection via bookmarklet
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { resolve } from 'path'

// 默认服务端地址 / Default server URL
const DEFAULT_SERVER = 'wss://paget.xyz'

export default defineConfig({
  plugins: [
    vue(),
    // 将 CSS 内联到 JS 中，加载时自动注入 <style> 标签到 head
    // Inline CSS into JS, auto-inject <style> tag to head on load
    cssInjectedByJsPlugin({
      topExecutionPriority: true,
    }),
  ],
  define: {
    // 注入默认服务端地址 / Inject default server URL
    __PAGET_DEFAULT_SERVER__: JSON.stringify(DEFAULT_SERVER),
    // 模拟 Node.js 环境变量（某些依赖需要）/ Simulate Node.js env vars (some deps need this)
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process.env': JSON.stringify({}),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      // 将 workspace 包指向源文件，以便打包到单文件中
      // Point workspace packages to source files for single-file bundling
      '@paget/shared': resolve(__dirname, '../shared/src/index.ts'),
      '@paget/page-controller': resolve(__dirname, '../page-controller/src/index.ts'),
    },
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'src/bookmarklet.ts'),
      name: 'Paget',
      fileName: () => 'paget.bookmarklet.js',
      formats: ['iife'],
    },
    outDir: resolve(__dirname, 'dist', 'iife'),
    // 单文件输出 / Single file output
    cssCodeSplit: false,
    // 生产环境压缩 / Minify for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 保留 console 用于调试 / Keep console for debugging
      },
    },
    rollupOptions: {
      output: {
        // 确保所有代码打包到单文件 / Ensure all code in single file
        inlineDynamicImports: true,
        // 处理静态资源：内联为 base64 / Handle assets: inline as base64
        assetFileNames: '[name].[ext]',
      },
    },
    // 静态资源内联阈值（4KB 以下内联）/ Asset inline threshold
    assetsInlineLimit: 100000,
  },
})
