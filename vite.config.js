import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Questa riga dice a Vite di usare il plugin React
  // per capire e compilare correttamente i file .jsx
  plugins: [react()],
})
