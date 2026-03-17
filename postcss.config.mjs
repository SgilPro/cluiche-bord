// Vitest/Vite loads this when resolving CSS; use no plugins so unit tests don't need Tailwind
const config = {
  plugins:
    typeof process !== "undefined" && process.env.VITEST === "1"
      ? []
      : ["@tailwindcss/postcss"],
};

export default config;
