/** @type {import('tailwindcss').Config} */
export default {
  // Questa sezione dice a Tailwind di cercare le classi
  // in tutti i file .html e in tutti i file .jsx dentro la cartella src.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
