import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF8F5",
        primary: {
          DEFAULT: "#7C9A82",
          light: "#A8C4AE",
          dark: "#526B57",
        },
        secondary: {
          DEFAULT: "#D4A373",
          light: "#E8C9A8",
          dark: "#B8834D",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          variant: "#F5F2ED",
        },
        border: "#E0DCD5",
        divider: "#F0EDE8",
        txt: {
          DEFAULT: "#2D3436",
          secondary: "#636E72",
          tertiary: "#B2BEC3",
        },
        safe: {
          DEFAULT: "#8FBC8F",
          bg: "#E8F5EC",
          text: "#2E7D46",
          border: "#A5D6B5",
        },
        caution: {
          DEFAULT: "#DAA520",
          bg: "#FFF8E1",
          text: "#9A6500",
          border: "#FFD54F",
        },
        toxic: {
          DEFAULT: "#CD5C5C",
          bg: "#FFEBEE",
          text: "#C62828",
          border: "#FFCDD2",
        },
        success: "#4CAF50",
        warning: "#FFA726",
        error: "#E53935",
        info: "#29B6F6",
        disabled: "#BDBDBD",
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        input: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
