import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  base: 'https://github.com/FedeNicoTorres/parking-test/', // <--- ¡REVISÁ ESTO! Tiene que coincidir con el nombre de tu repo
})