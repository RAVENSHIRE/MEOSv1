/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg: "#0a0e14",
          panel: "#0d1117",
          border: "#1a2332",
          green: "#00ff9f",
          "green-dim": "#00cc7f",
          red: "#ff3b3b",
          "red-dim": "#cc2f2f",
          yellow: "#ffb800",
          "yellow-dim": "#cc9300",
          blue: "#00b4ff",
          "blue-dim": "#0090cc",
          gray: "#3a4a5c",
          "gray-light": "#6b7d8f",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      animation: {
        blink: "blink 1s step-end infinite",
        "fade-in": "fadeIn 0.3s ease-out",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
