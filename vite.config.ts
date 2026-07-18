import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'url'
import svgr from 'vite-plugin-svgr'
import legacy from '@vitejs/plugin-legacy'
import postcssOKLabFunction from '@csstools/postcss-oklab-function'
import postcssColorMixFunction from '@csstools/postcss-color-mix-function'
import postcssCascadeLayers from '@csstools/postcss-cascade-layers'
import postcssLogical from 'postcss-logical'

// Safari 14.0 (iOS 14.0–14.4) does not support flex `gap` (14.5+). Old iOS is
// detected via `@supports (-webkit-touch-callout: none) and (not (translate:
// none))` — individual transform properties shipped in the same Safari 14.1
// release as flex gap, and -webkit-touch-callout limits it to iOS so old
// desktop Chrome/Firefox never double-apply margins on top of working gap.
const OLD_IOS_SUPPORTS_QUERY =
  '(-webkit-touch-callout: none) and (not (translate: none))'

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
        // Tailwind 4 emits logical shorthands (padding-inline/margin-block/…)
        // for px-*/py-*/mx-*/space-y-* etc., which Safari < 14.1 drops —
        // on iOS 14.0–14.4 every horizontal/vertical padding and margin
        // utility silently did nothing. The app is LTR-only (en/zh), so
        // rewriting to physical properties is lossless.
        postcssLogical(),
        postcssCascadeLayers(),
        // postcss-cascade-layers emulates layer priority by inflating
        // specificity with `:not(#\#)` chains, which lets low-priority rules
        // like Tailwind preflight's `button { color: inherit }` (boosted to
        // 6 ids) beat unlayered component CSS — CSS modules, antd runtime
        // styles — that native @layer would never override. This stylesheet's
        // physical order already matches its layer order (theme → base →
        // utilities → app styles), so source order + plain specificity gives
        // the correct cascade; strip the boosts.
        // Safari < 15.4 drops an entire rule when any selector in its list is
        // unknown. Tailwind groups `::backdrop` (and `::file-selector-button`)
        // with `*`/`::before`/`::after` in preflight and in the @supports
        // fallback that seeds `--tw-*` defaults (--tw-border-style etc.) for
        // browsers without @property — so on iOS 14 those rules vanished and
        // e.g. `.border` computed to border-style:none. Split the risky
        // pseudo-elements into their own rule so the rest survives.
        {
          postcssPlugin: 'split-modern-pseudo-element-selectors',
          OnceExit(root) {
            root.walkRules((rule) => {
              const risky = rule.selectors.filter((s) =>
                /::(backdrop|file-selector-button)/.test(s),
              )
              if (risky.length > 0 && risky.length < rule.selectors.length) {
                rule.cloneAfter({ selectors: risky })
                rule.selectors = rule.selectors.filter(
                  (s) => !risky.includes(s),
                )
              }
            })
          },
        },
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
        // Emulate flex gap with margins on Safari 14.0 (see
        // OLD_IOS_SUPPORTS_QUERY above). Selectors require .flex/.inline-flex
        // so grid containers (where native gap works since Safari 12) are
        // untouched; base utilities only — rules inside @media are skipped
        // because md:+ breakpoints never apply on the old phones this targets.
        {
          postcssPlugin: 'flex-gap-fallback-for-old-ios',
          OnceExit(root, { AtRule, Rule, Declaration }) {
            const fallback = new AtRule({
              name: 'supports',
              params: OLD_IOS_SUPPORTS_QUERY,
            })
            const addRule = (
              selectors: string[],
              props: Record<string, string>,
            ) => {
              const rule = new Rule({ selector: selectors.join(',') })
              for (const [prop, value] of Object.entries(props)) {
                rule.append(new Declaration({ prop, value }))
              }
              fallback.append(rule)
            }
            root.walkRules((rule) => {
              if (rule.parent?.type === 'atrule') return
              const m = rule.selector.match(/^\.(gap(?:-x|-y)?)-[\w.\\]+$/)
              if (!m) return
              let axis: string | null = null
              let value: string | null = null
              rule.walkDecls((decl) => {
                if (['gap', 'column-gap', 'row-gap'].includes(decl.prop)) {
                  axis = decl.prop
                  value = decl.value
                }
              })
              if (!value) return
              const s = rule.selector
              if (axis === 'gap' || axis === 'column-gap') {
                addRule(
                  [
                    `.flex${s}:not(.flex-col):not(.flex-wrap)>:not(:first-child)`,
                    `.inline-flex${s}:not(.flex-col):not(.flex-wrap)>:not(:first-child)`,
                  ],
                  { 'margin-left': value },
                )
              }
              if (axis === 'gap' || axis === 'row-gap') {
                addRule([`.flex.flex-col${s}>:not(:first-child)`], {
                  'margin-top': value,
                })
              }
              if (axis === 'gap') {
                addRule([`.flex.flex-wrap${s}>*`], {
                  margin: `calc(${value} / 2)`,
                })
                addRule([`.flex.flex-wrap${s}`], {
                  margin: `calc(${value} / -2)`,
                })
              }
              if (axis === 'row-gap') {
                addRule([`.flex.flex-wrap${s}>*`], {
                  'margin-bottom': value,
                })
              }
            })
            if (fallback.nodes?.length) root.append(fallback)
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