import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/ — 產線掛在網域根
export default defineConfig({
  base: '/',
  plugins: [react()],
})
