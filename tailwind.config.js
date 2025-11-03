// tailwind.config.js
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",   // <= 반드시 이거 있어야 HeaderBar.tsx, ChatDock.tsx 읽힘
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
