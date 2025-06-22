/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class", // User can toggle dark mode by adding/removing "dark" class on <body>
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./ALLFUNCTIONFILES/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your PDF4EVER branding
        primary: {
          DEFAULT: "#005aff",  // blue
          dark: "#0040c1",
        },
        accent: {
          DEFAULT: "#ff3900",  // orange
          dark: "#c12c00",
        },
        // Some useful greys, backgrounds, etc
        background: "#f7fafc",
        "background-dark": "#10141e",
        // Add more custom colors here as needed
      },
      fontFamily: {
        // Example: use Inter for a clean look (add via Google Fonts if desired)
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
