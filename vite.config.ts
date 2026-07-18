import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import svgr from 'vite-plugin-svgr'
import legacy from '@vitejs/plugin-legacy'
import postcssOKLabFunction from '@csstools/postcss-oklab-function'
import postcssColorMixFunction from '@csstools/postcss-color-mix-function'
import postcssCascadeLayers from '@csstools/postcss-cascade-layers'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    // Support older Safari (e.g. iOS 14): transpile modern syntax and inject
    // polyfills for APIs the browser lacks (structuredClone, Array.at, etc.).
    legacy({
      targets: ['defaults', 'ios_saf >= 14'],
      modernPolyfills: true,
    }),
  ],
  // Ensure the modern bundle's syntax is also parseable by Safari 14.
  build: {
    target: ['es2020', 'safari14'],
  },
  // Downlevel modern CSS (Tailwind 4) for older Safari. `preserve: true` keeps
  // the modern oklch()/color-mix() for new browsers and adds rgb fallbacks;
  // cascade-layers flattens @layer, which Safari < 15.4 drops entirely.
  css: {
    postcss: {
      plugins: [
        postcssOKLabFunction({ preserve: true }),
        postcssColorMixFunction({ preserve: true }),
        postcssCascadeLayers(),
        // postcss-cascade-layers emulates layer priority by inflating
        // specificity with `:not(#\#)` chains, which lets low-priority rules
        // like Tailwind preflight's `button { color: inherit }` (boosted to
        // 6 ids) beat unlayered component CSS — CSS modules, antd runtime
        // styles — that native @layer would never override. This stylesheet's
        // physical order already matches its layer order (theme → base →
        // utilities → app styles), so source order + plain specificity gives
        // the correct cascade; strip the boosts.
        {
          postcssPlugin: 'strip-cascade-layer-specificity-boosts',
          OnceExit(root) {
            root.walkRules((rule) => {
              if (rule.selector.includes(':not(#\\#)')) {
                rule.selector = rule.selector.replaceAll(':not(#\\#)', '')
              }
            })
          },
        },
      ],
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api/v1': {
        target: 'http://35.229.204.234:8080',
        changeOrigin: true,
      },
    },
  },
  // `vite preview` does not inherit server.proxy; needed when testing the
  // built app from a real device on the LAN.
  preview: {
    proxy: {
      '/api/v1': {
        target: 'http://35.229.204.234:8080',
        changeOrigin: true,
      },
    },
  },
})