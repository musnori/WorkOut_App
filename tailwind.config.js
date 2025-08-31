// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0faff",
          100: "#e0f7ff",
          200: "#b9ecff",
          300: "#8ddfff",
          400: "#5ad1ff",
          500: "#2bbfff",   // メイン
          600: "#199edb",
          700: "#147ea9",
          800: "#105e7d",
          900: "#0b3e52",
        },
      },
      boxShadow: {
        soft: "0 6px 20px rgba(0,0,0,0.06)",
      },
    },
  },
  plugins: [],
};
