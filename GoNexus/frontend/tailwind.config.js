/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Space Grotesk", "sans-serif"],
      },
      colors: {
        border: "#000000",
        input: "#000000",
        ring: "#000000",
        background: "#ffffff",
        foreground: "#000000",
        primary: {
          DEFAULT: "#4ADE80", // Bright Green
          foreground: "#000000",
        },
        secondary: {
          DEFAULT: "#FDE047", // Yellow
          foreground: "#000000",
        },
        destructive: {
          DEFAULT: "#F87171", // Red
          foreground: "#000000",
        },
        muted: {
          DEFAULT: "#F3F4F6",
          foreground: "#4B5563",
        },
        accent: {
          DEFAULT: "#A78BFA", // Purple
          foreground: "#000000",
        },
      },
      borderRadius: {
        lg: "0px",
        md: "0px",
        sm: "0px",
      },
      boxShadow: {
        brutal: "4px 4px 0px 0px rgba(0,0,0,1)",
        "brutal-hover": "6px 6px 0px 0px rgba(0,0,0,1)",
        "brutal-active": "2px 2px 0px 0px rgba(0,0,0,1)",
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
}
