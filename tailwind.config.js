/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          primary: '#FF00F0',
          secondary: '#00FFFF', 
          accent: '#FFFF00',
          bg: '#121212',
          text: '#F0F0F0',
          glow: {
            primary: '#FF00F080',
            secondary: '#00FFFF80',
            accent: '#FFFF0080'
          }
        },
      },
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        'roboto-mono': ['Roboto Mono', 'monospace']
      },
      boxShadow: {
        'token-fuel': '0 0 30px rgba(10, 252, 78, 0.5)',
        'token-silencio': '0 0 30px rgba(64, 134, 214, 0.5)',
        'token-almanak': '0 0 30px rgba(255, 183, 77, 0.5)',
        'token-pulse': '0 0 30px rgba(255, 99, 132, 0.5)',
        'token-enclave': '0 0 30px rgba(153, 102, 255, 0.5)',
        'token-corn': '0 0 30px rgba(255, 206, 86, 0.5)',
        'token-giza': '0 0 30px rgba(255, 159, 64, 0.5)',
        'token-nil': '0 0 30px rgba(75, 192, 192, 0.5)',
        'token-eoracle': '0 0 30px rgba(54, 162, 235, 0.5)',
        'token-hyperlane': '0 0 30px rgba(201, 203, 207, 0.5)',
        'token-default': '0 0 30px rgba(255, 0, 240, 0.5)',
        'neon': '0 0 20px var(--tw-shadow-color)',
        'neon-lg': '0 0 30px var(--tw-shadow-color)'
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'flicker': 'flicker 2s linear infinite'
      },
      keyframes: {
        glow: {
          '0%': { textShadow: '0 0 10px #FF00F0, 0 0 20px #FF00F0, 0 0 30px #FF00F0' },
          '100%': { textShadow: '0 0 20px #00FFFF, 0 0 30px #00FFFF, 0 0 40px #00FFFF' }
        },
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: '0.99' },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: '0.4' }
        }
      }
    }
  },
  plugins: []
};