/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tron: {
          bg: '#09131b',
          text: '#cfd0d1',
          accent: '#00ffee',
          link: '#00afff',
          linkHover: '#37fffc'
        }
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
        'token-default': '0 0 30px rgba(0, 255, 238, 0.5)'
      }
    }
  },
  plugins: []
};