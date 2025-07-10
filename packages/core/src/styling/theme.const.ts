import type { OldTheme } from './theme'

export const CUSTOM_PROPERTIES_STYLESHEET_ID = 'nc-custom-properties'

export const RESET_STYLES = `
@layer reset {
  html {
    height:100%;
  }

  #App {
    height:100%;
    display:flex;
    flex-direction:column;
  }

  body {
    height:100%;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    margin:0;
  }

  [data-node-id]:not([data-unset-toddle-styles],[data-node-type="text"],noscript,br,script,style,math,math *,link,template,meta,title,base), [data-node-id]:not([data-unset-toddle-styles],noscript)::before, [data-node-id]:not([data-unset-toddle-styles],noscript)::after {
    display: flex;
    flex-direction: column;
    flex-grow: 0;
    flex-shrink: 0;

    position: relative;
    box-sizing: border-box;
    padding: 0;
    margin: 0;

    font-size: var(--text-base);
    font-family: var(--font-sans);
    font-weight: var(--font-weight-normal);

    background: transparent;
    color: inherit;
    border: none;
    box-shadow: none;
  }

  [data-node-id]:not([data-unset-toddle-styles]):is(p, h1, h2, h3, h4, h5, h6, label, span, strong, b, i, address, caption, code, cite, dt, dd, em, figcaption, legend, blockquote, abbr, pre, bdo, bdi) {
    display: inline-block;
    overflow-wrap: break-word;
    color: inherit;
  }

  [data-node-id]:not([data-unset-toddle-styles]):is(input, button, textarea, select) {
    outline: none;
  }

  [data-node-id]:not([data-unset-toddle-styles]):is(a) {
    color: inherit;
    text-decoration: none;
  }

  [data-node-id]:not([data-unset-toddle-styles]):is(ul, ol, li) {
    list-style: none;
  }

  [data-node-id]:not([data-unset-toddle-styles]):is(span[data-node-type="text"]) {
    font: inherit;
    display: inline;
    flex-direction: column;
    flex-grow: 0;
    flex-shrink: 0;
    box-sizing: border-box;
  }

  [popover]:not(:popover-open):not(dialog[open]) {
    display: revert;
  }
}`
export const theme: OldTheme = {
  colors: {
    grey: {
      order: 0,
      variants: {
        '50': { order: 0, value: '#FAFAFA' },
        '100': { order: 1, value: '#F5F5F5' },
        '200': { order: 2, value: '#E5E5E5' },
        '300': { order: 3, value: '#D4D4D4' },
        '400': { order: 4, value: '#A3A3A3' },
        '500': { order: 5, value: '#737373' },
        '600': { order: 6, value: '#525252' },
        '700': { order: 7, value: '#404040' },
        '800': { order: 8, value: '#262626' },
        '900': { order: 9, value: '#171717' },
      },
    },
    red: {
      order: 1,
      variants: {
        '50': { order: 0, value: '#FEF2F2' },
        '100': { order: 1, value: '#FEE2E2' },
        '200': { order: 2, value: '#FECACA' },
        '300': { order: 3, value: '#FCA5A5' },
        '400': { order: 4, value: '#F87171' },
        '500': { order: 5, value: '#EF4444' },
        '600': { order: 6, value: '#DC2626' },
        '700': { order: 7, value: '#B91C1C' },
        '800': { order: 8, value: '#991B1B' },
        '900': { order: 9, value: '#7F1D1D' },
      },
    },
    rose: {
      order: 3,
      variants: {
        '50': { order: 0, value: '#FFF1F2' },
        '100': { order: 1, value: '#FFE4E6' },
        '200': { order: 2, value: '#FECDD3' },
        '300': { order: 3, value: '#FDA4AF' },
        '400': { order: 4, value: '#FB7185' },
        '500': { order: 5, value: '#F43F5E' },
        '600': { order: 6, value: '#E11D48' },
        '700': { order: 7, value: '#BE123C' },
        '800': { order: 8, value: '#9F1239' },
        '900': { order: 9, value: '#881337' },
      },
    },
    pink: {
      order: 4,
      variants: {
        '50': { order: 0, value: '#FDF2F8' },
        '100': { order: 1, value: '#FCE7F3' },
        '200': { order: 2, value: '#FBCFE8' },
        '300': { order: 3, value: '#F9A8D4' },
        '400': { order: 4, value: '#F472B6' },
        '500': { order: 5, value: '#EC4899' },
        '600': { order: 6, value: '#DB2777' },
        '700': { order: 7, value: '#BE185D' },
        '800': { order: 8, value: '#9D174D' },
        '900': { order: 9, value: '#831843' },
      },
    },
    amber: {
      order: 5,
      variants: {
        '50': { order: 0, value: '#FFFBEB' },
        '100': { order: 1, value: '#FEF3C7' },
        '200': { order: 2, value: '#FDE68A' },
        '300': { order: 3, value: '#FCD34D' },
        '400': { order: 4, value: '#FBBF24' },
        '500': { order: 5, value: '#F59E0B' },
        '600': { order: 6, value: '#D97706' },
        '700': { order: 7, value: '#B45309' },
        '800': { order: 8, value: '#92400E' },
        '900': { order: 9, value: '#78350F' },
      },
    },
    orange: {
      order: 6,
      variants: {
        '50': { order: 0, value: '#FFF7ED' },
        '100': { order: 1, value: '#FFEDD5' },
        '200': { order: 2, value: '#FED7AA' },
        '300': { order: 3, value: '#FDBA74' },
        '400': { order: 4, value: '#FB923C' },
        '500': { order: 5, value: '#F97316' },
        '600': { order: 6, value: '#EA580C' },
        '700': { order: 7, value: '#C2410C' },
        '800': { order: 8, value: '#9A3412' },
        '900': { order: 9, value: '#7C2D12' },
      },
    },
    yellow: {
      order: 7,
      variants: {
        '50': { order: 0, value: '#FFFBEB' },
        '100': { order: 1, value: '#FEF3C7' },
        '200': { order: 2, value: '#FDE68A' },
        '300': { order: 3, value: '#FCD34D' },
        '400': { order: 4, value: '#FBBF24' },
        '500': { order: 5, value: '#F59E0B' },
        '600': { order: 6, value: '#D97706' },
        '700': { order: 7, value: '#B45309' },
        '800': { order: 8, value: '#92400E' },
        '900': { order: 9, value: '#78350F' },
      },
    },
    lime: {
      order: 8,
      variants: {
        '50': { order: 0, value: '#F7FEE7' },
        '100': { order: 1, value: '#ECFCCB' },
        '200': { order: 2, value: '#D9F99D' },
        '300': { order: 3, value: '#BEF264' },
        '400': { order: 4, value: '#A3E635' },
        '500': { order: 5, value: '#84CC16' },
        '600': { order: 6, value: '#65A30D' },
        '700': { order: 7, value: '#4D7C0F' },
        '800': { order: 8, value: '#3F6212' },
        '900': { order: 9, value: '#365314' },
      },
    },
    green: {
      order: 9,
      variants: {
        '50': { order: 0, value: '#ECFDF5' },
        '100': { order: 1, value: '#D1FAE5' },
        '200': { order: 2, value: '#A7F3D0' },
        '300': { order: 3, value: '#6EE7B7' },
        '400': { order: 4, value: '#34D399' },
        '500': { order: 5, value: '#10B981' },
        '600': { order: 6, value: '#059669' },
        '700': { order: 7, value: '#047857' },
        '800': { order: 8, value: '#065F46' },
        '900': { order: 9, value: '#064E3B' },
      },
    },
    emerald: {
      order: 10,
      variants: {
        '50': { order: 0, value: '#ECFDF5' },
        '100': { order: 1, value: '#D1FAE5' },
        '200': { order: 2, value: '#A7F3D0' },
        '300': { order: 3, value: '#6EE7B7' },
        '400': { order: 4, value: '#34D399' },
        '500': { order: 5, value: '#10B981' },
        '600': { order: 6, value: '#059669' },
        '700': { order: 7, value: '#047857' },
        '800': { order: 8, value: '#065F46' },
        '900': { order: 9, value: '#064E3B' },
      },
    },
    teal: {
      order: 11,
      variants: {
        '50': { order: 0, value: '#F0FDFA' },
        '100': { order: 1, value: '#CCFBF1' },
        '200': { order: 2, value: '#99F6E4' },
        '300': { order: 3, value: '#5EEAD4' },
        '400': { order: 4, value: '#2DD4BF' },
        '500': { order: 5, value: '#14B8A6' },
        '600': { order: 6, value: '#0D9488' },
        '700': { order: 7, value: '#0F766E' },
        '800': { order: 8, value: '#115E59' },
        '900': { order: 9, value: '#134E4A' },
      },
    },
    cyan: {
      order: 12,
      variants: {
        '50': { order: 0, value: '#ECFEFF' },
        '100': { order: 1, value: '#CFFAFE' },
        '200': { order: 2, value: '#A5F3FC' },
        '300': { order: 3, value: '#67E8F9' },
        '400': { order: 4, value: '#22D3EE' },
        '500': { order: 5, value: '#06B6D4' },
        '600': { order: 6, value: '#0891B2' },
        '700': { order: 7, value: '#0E7490' },
        '800': { order: 8, value: '#155E75' },
        '900': { order: 9, value: '#164E63' },
      },
    },
    sky: {
      order: 13,
      variants: {
        '50': { order: 0, value: '#F0F9FF' },
        '100': { order: 1, value: '#E0F2FE' },
        '200': { order: 2, value: '#BAE6FD' },
        '300': { order: 3, value: '#7DD3FC' },
        '400': { order: 4, value: '#38BDF8' },
        '500': { order: 5, value: '#0EA5E9' },
        '600': { order: 6, value: '#0284C7' },
        '700': { order: 7, value: '#0369A1' },
        '800': { order: 8, value: '#075985' },
        '900': { order: 9, value: '#0C4A6E' },
      },
    },
    blue: {
      order: 14,
      variants: {
        '50': { order: 0, value: '#EFF6FF' },
        '100': { order: 1, value: '#DBEAFE' },
        '200': { order: 2, value: '#BFDBFE' },
        '300': { order: 3, value: '#93C5FD' },
        '400': { order: 4, value: '#60A5FA' },
        '500': { order: 5, value: '#3B82F6' },
        '600': { order: 6, value: '#2563EB' },
        '700': { order: 7, value: '#1D4ED8' },
        '800': { order: 8, value: '#1E40AF' },
        '900': { order: 9, value: '#1E3A8A' },
      },
    },

    indigo: {
      order: 15,
      variants: {
        '50': { order: 0, value: '#EEF2FF' },
        '100': { order: 1, value: '#E0E7FF' },
        '200': { order: 2, value: '#C7D2FE' },
        '300': { order: 3, value: '#A5B4FC' },
        '400': { order: 4, value: '#818CF8' },
        '500': { order: 5, value: '#6366F1' },
        '600': { order: 6, value: '#4F46E5' },
        '700': { order: 7, value: '#4338CA' },
        '800': { order: 8, value: '#3730A3' },
        '900': { order: 9, value: '#312E81' },
      },
    },

    purple: {
      order: 16,
      variants: {
        '50': { order: 0, value: '#F5F3FF' },
        '100': { order: 1, value: '#EDE9FE' },
        '200': { order: 2, value: '#DDD6FE' },
        '300': { order: 3, value: '#C4B5FD' },
        '400': { order: 4, value: '#A78BFA' },
        '500': { order: 5, value: '#8B5CF6' },
        '600': { order: 6, value: '#7C3AED' },
        '700': { order: 7, value: '#6D28D9' },
        '800': { order: 8, value: '#5B21B6' },
        '900': { order: 9, value: '#4C1D95' },
      },
    },

    fuchsia: {
      order: 17,
      variants: {
        '50': { order: 0, value: '#FDF4FF' },
        '100': { order: 1, value: '#FAE8FF' },
        '200': { order: 2, value: '#F5D0FE' },
        '300': { order: 3, value: '#F0ABFC' },
        '400': { order: 4, value: '#E879F9' },
        '500': { order: 5, value: '#D946EF' },
        '600': { order: 6, value: '#C026D3' },
        '700': { order: 7, value: '#A21CAF' },
        '800': { order: 8, value: '#86198F' },
        '900': { order: 9, value: '#701A75' },
      },
    },
  },

  shadow: {
    sm: { order: 0, value: '0 1px 2px 0 rgba(0, 0, 0, 0.25)' },
    base: {
      order: 1,
      value: '0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px 0 rgba(0, 0, 0, 0.25)',
    },
    md: {
      order: 2,
      value:
        '0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.25)',
    },
    lg: {
      order: 3,
      value:
        '0 10px 15px -3px rgba(0, 0, 0, 0.25), 0 4px 6px -2px rgba(0, 0, 0, 0.25)',
    },
    xl: {
      order: 4,
      value:
        '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 10px 10px -5px rgba(0, 0, 0, 0.25)',
    },
    '2xl': { order: 5, value: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' },
  },

  spacing: 0.25,
  fontSize: {
    lg: { order: 0, value: '1.125rem' },
    sm: { order: 1, value: '0.875rem' },
    xl: { order: 2, value: '1.25rem' },
    xs: { order: 3, value: '0.75rem' },
    '2xl': { order: 4, value: '1.5rem' },
    '3xl': { order: 5, value: '1.875rem' },
    '4xl': { order: 6, value: '2.25rem' },
    '5xl': { order: 7, value: '3rem' },
    xxs: { order: 8, value: '0.625rem' },
    base: { order: 9, value: '1rem', default: true },
  },
  fontFamily: {
    mono: { order: 0, value: ['Fira Code', 'monospace'] },
    sans: { order: 1, value: ['Inter', 'sans-serif'], default: true },
  },
  fontWeight: {
    bold: { order: 0, value: '700' },
    bolder: { order: 1, value: '800' },
    normal: { order: 2, value: '500', default: true },
    regular: { order: 3, value: '400' },
    'semi-bold': { order: 4, value: '600' },
  },
  breakpoints: {
    large: { order: 2, value: 1440 },
    small: { order: 0, value: 576 },
    medium: { order: 1, value: 960 },
  },
}
