/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        "scroll-up": "scroll-up 40s linear infinite",
        marquee: "marquee 10s linear infinite",
      },
      keyframes: {
        "scroll-up": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-33.3333%)" },
        },
      },
      height: {
        "main-section": "790px",
      },

      fontSize: {
        xs: ".875rem", // 14px
        sm: "1rem", // 16px
        base: "1.25rem", // 20px
        md: "2rem", // 32px
        lg: "2.5rem", // 40px
        xl: "3rem", // 48px
        // ... add more as needed
      },
      colors: {
        orange: {
          20: "#FFF3E9",
          200: "#FF8B3633",
          300: "#FFB987",
          400: "#FFAE72",
          500: "#FF8B36",
          700: "#FF8329",
          800: "#FF7D1F",
        },
        red: {
          200: "#FF442933",
          400: "#FF5D45",
          500: "#FF4429",
        },
        brownblack: {
          20: "#F7F1ED",
          50: "#F0E0DC",
          100: "#CCB5AF",
          200: "#C2ABA5",
          300: "#B8A19B",
          400: "#92837F",
          500: "#634C46",
          700: "#220A03",
        },
        gray: {
          50: "#EEEEEE",
          100: "#CCCCCC",
          200: "#C8C8C8",
          300: "#C5C5C5",
          400: "#9D9D9D",
          500: "#5C5C5C",
        },
      },
    },
  },
  plugins: [],
};
