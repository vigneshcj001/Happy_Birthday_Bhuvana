import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/Happy_Birthday_Bhuvana/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
