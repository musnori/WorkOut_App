/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        soft: "0 6px 20px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};
