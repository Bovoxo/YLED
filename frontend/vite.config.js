import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'YLeventdeck',
        short_name: 'YLeventdeck',
        description: 'Všechny táborové nástroje na jednom místě.',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone', // Toto zajistí, že se aplikace otevře bez lišty prohlížeče
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  server: {
    allowedHosts: [
      'yleventdeck.cloud',
      'www.yleventdeck.cloud'
    ]
  }
})