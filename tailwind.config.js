/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Orbitron", "system-ui", "sans-serif"],
        mono: ['"Share Tech Mono"', "ui-monospace", "monospace"],
      },
      colors: {
        arena: {
          void: "#05080d",
          panel: "#0c1219",
          edge: "#1a2a3a",
          neon: "#00f0ff",
          lime: "#39ff14",
          alert: "#ff3366",
        },
      },
      boxShadow: {
        neon: "0 0 20px rgba(0, 240, 255, 0.25)",
        lime: "0 0 24px rgba(57, 255, 20, 0.2)",
      },
      backgroundImage: {
        "grid-fade":
          "linear-gradient(to bottom, rgba(5,8,13,0.2), rgba(5,8,13,0.95)), radial-gradient(circle at 50% 0%, rgba(0,240,255,0.12), transparent 55%)",
      },
    },
  },
  plugins: [],
};
