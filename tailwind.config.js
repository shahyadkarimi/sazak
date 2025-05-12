import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // #5139da
        bgPrimaryTheme: "#ebebeb5e",
        primaryThemeColor: "#a600ff",
        // #f14a4a
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
    },
  },

  plugins: [heroui()],
};
