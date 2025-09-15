/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './resources/views/**/*.blade.php',
    './resources/js/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs Primaires SABC
        'sabc-red-primary': 'var(--sabc-red-primary)',
        'sabc-red-light': 'var(--sabc-red-light)',
        'sabc-red-dark': 'var(--sabc-red-dark)',
        'sabc-accent': 'var(--sabc-accent)',
        'sabc-accent-light': 'var(--sabc-accent-light)',
        
        // Nuances de Gris
        'sabc-gray-50': 'var(--sabc-gray-50)',
        'sabc-gray-100': 'var(--sabc-gray-100)',
        'sabc-gray-200': 'var(--sabc-gray-200)',
        'sabc-gray-400': 'var(--sabc-gray-400)',
        'sabc-gray-500': 'var(--sabc-gray-400)', // Alias pour cohérence
        'sabc-gray-600': 'var(--sabc-gray-400)', // Alias pour cohérence
        'sabc-gray-800': 'var(--sabc-gray-800)',
        'sabc-gray-900': 'var(--sabc-gray-900)',
        
        // Couleurs Fonctionnelles
        'sabc-success': 'var(--sabc-success)',
        'sabc-warning': 'var(--sabc-warning)',
        'sabc-error': 'var(--sabc-error)',
        'sabc-info': 'var(--sabc-info)',
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
