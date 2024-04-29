/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./comp/*.{html,js,templ}"],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/forms")],
};
