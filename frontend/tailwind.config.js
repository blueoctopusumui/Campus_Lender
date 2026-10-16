/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        heading: ['"Manrope"', '"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        // Design System Palette
        canvas: '#F6F5F1',      // Main background (warm off-white)
        muted: '#ECEAE3',       // Secondary background (muted stone)
        border: '#DAD8D0',      // Borders & dividers (subtle warm gray)
        surface: '#FFFFFF',     // White surface
        
        ink: {
          primary: '#242722',   // Primary text (deep charcoal)
          secondary: '#74766F', // Secondary text (muted gray)
          tertiary: '#9A9C94',  // Subtle captions & placeholders
        },

        accent: {
          DEFAULT: '#526B56',   // Understated forest green
          hover: '#3F5543',     // Deeper green
          light: '#EBF0EC',     // Soft green tint
          subtle: '#DFE7E0',
        },

        // Controlled status tokens
        status: {
          'success-bg': '#EBF0EC',
          'success-text': '#325238',
          'success-border': '#C6D8C8',

          'warn-bg': '#F7F2E7',
          'warn-text': '#785918',
          'warn-border': '#E5D8BE',

          'danger-bg': '#FAECEB',
          'danger-text': '#8A332F',
          'danger-border': '#E8C4C2',

          'neutral-bg': '#ECEAE3',
          'neutral-text': '#494B45',
          'neutral-border': '#DAD8D0',
        },

        // Backward compatibility mappings mapped to the new palette
        brand: {
          50:  '#F6F5F1',
          100: '#ECEAE3',
          200: '#DAD8D0',
          300: '#C7C5BC',
          400: '#9A9C94',
          500: '#74766F',
          600: '#5A5C55',
          700: '#41443D',
          800: '#2F322D',
          900: '#242722',
          950: '#181A16',
        },
        ivy: {
          50:  '#EBF0EC',
          100: '#DFE7E0',
          200: '#C6D8C8',
          500: '#526B56',
          600: '#465D4A',
          700: '#3B5740',
          800: '#325238',
          900: '#243B29',
        },
        ochre: {
          50:  '#F7F2E7',
          100: '#F2E9D6',
          200: '#E5D8BE',
          500: '#A47D2E',
          600: '#8C671E',
          700: '#785918',
          800: '#624610',
          900: '#4C350A',
        },
        crimson: {
          50:  '#FAECEB',
          100: '#F5DCDA',
          200: '#E8C4C2',
          500: '#B84540',
          600: '#9E3733',
          700: '#8A332F',
          800: '#6F2623',
          900: '#541C1A',
        },
      },
      boxShadow: {
        subtle: '0 1px 2px 0 rgba(36, 39, 34, 0.04)',
        card: '0 1px 3px 0 rgba(36, 39, 34, 0.06), 0 1px 2px 0 rgba(36, 39, 34, 0.04)',
        elevated: '0 4px 6px -1px rgba(36, 39, 34, 0.08), 0 2px 4px -1px rgba(36, 39, 34, 0.04)',
        modal: '0 10px 25px -3px rgba(36, 39, 34, 0.12), 0 4px 6px -2px rgba(36, 39, 34, 0.05)',
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
      }
    }
  },
  plugins: []
};
