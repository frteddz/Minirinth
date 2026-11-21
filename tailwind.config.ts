import type { Config } from 'tailwindcss'
import preset from './src/ui/tailwind-preset'

export default {
	content: ['./index.html', './src/**/*.{vue,ts}'],
	presets: [preset],
	theme: {
		extend: {
			borderRadius: {
				xs: 'var(--radius-xs)',
				sm: 'var(--radius-sm)',
				md: 'var(--radius-md)',
				lg: 'var(--radius-lg)',
				xl: 'var(--radius-xl)',
				'2xl': 'var(--radius-xl)',
				full: 'var(--radius-max)',
			},
		},
	},
} satisfies Config
