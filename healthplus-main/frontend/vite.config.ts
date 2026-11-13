import { defineConfig, type ViteDevServer, type PreviewServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8')
    content.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=')
        const key = trimmed.slice(0, idx).trim()
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '')
        process.env[key] = val
      }
    })
  }
}

loadEnvFile(path.resolve(import.meta.dirname, './.env'))
loadEnvFile(path.resolve(import.meta.dirname, '../.env'))

function attachHealthPlusApi(middlewares: ViteDevServer['middlewares'] | PreviewServer['middlewares']) {
  middlewares.use('/api/health', (req, res, next) => {
    try {
      const targetPath = path.resolve(import.meta.dirname, '../api/health.js')
      delete require.cache[targetPath]
      const handler = require(targetPath)
      handler(req, res)
    } catch (err) {
      next(err)
    }
  })

  middlewares.use('/api/ai/chat', async (req, res, next) => {
    try {
      const targetPath = path.resolve(import.meta.dirname, '../api/ai/chat.js')
      delete require.cache[targetPath]
      const handler = require(targetPath)
      await handler(req, res)
    } catch (err) {
      next(err)
    }
  })

  middlewares.use('/api/auth/login', async (req, res, next) => {
    try {
      const handler = require(path.resolve(import.meta.dirname, '../api/auth/login.js'))
      await handler(req, res)
    } catch (err) {
      next(err)
    }
  })

  middlewares.use('/api/auth/signup', async (req, res, next) => {
    try {
      const handler = require(path.resolve(import.meta.dirname, '../api/auth/signup.js'))
      await handler(req, res)
    } catch (err) {
      next(err)
    }
  })

  middlewares.use('/api/auth/reset-password', async (req, res, next) => {
    try {
      const handler = require(path.resolve(import.meta.dirname, '../api/auth/reset-password.js'))
      await handler(req, res)
    } catch (err) {
      next(err)
    }
  })
}

const localApiPlugin = {
  name: 'healthplus-local-api-gateway',
  configureServer(server: ViteDevServer) {
    attachHealthPlusApi(server.middlewares)
  },
  configurePreviewServer(server: PreviewServer) {
    attachHealthPlusApi(server.middlewares)
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), localApiPlugin],
  server: {
    proxy: {
      '/api/nutrition': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/motion')) {
            return 'vendor-motion';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
        },
      },
    },
  },
})
