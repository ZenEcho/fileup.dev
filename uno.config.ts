import { defineConfig, presetUno, presetAttributify, presetIcons } from 'unocss'

export default defineConfig({
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
  ],
  theme: {
    colors: {
      primary: '#6366f1', // Indigo
      'primary-dark': '#4f46e5',
      secondary: '#10b981', // Emerald
      dark: '#0f172a',
      light: '#f8fafc',
      'text-main': '#1e293b',
      'text-muted': '#64748b',
      border: '#e2e8f0',
      glass: 'rgba(255, 255, 255, 0.8)',
    },
    fontFamily: {
      sans: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
    }
  },
  shortcuts: {
    'flex-center': 'flex items-center justify-center',
    'flex-between': 'flex items-center justify-between',
    'container-custom': 'max-w-1200px mx-auto px-6',
    'btn': 'px-8 py-3.5 rounded-lg font-600 text-1.1rem inline-flex items-center gap-2 cursor-pointer border-1 border-transparent transition-all duration-300 no-underline',
    'btn-primary': 'bg-primary text-white shadow-[0_10px_25px_-5px_rgba(99,102,241,0.4)] hover:bg-primary-dark hover:-translate-y-0.5',
    'btn-outline': 'border-border text-text-main bg-white hover:border-text-main hover:bg-light',
  }
})
