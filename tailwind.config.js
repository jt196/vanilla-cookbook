import daisyui from 'daisyui'
import forms from '@tailwindcss/forms'
import typography from '@tailwindcss/typography'

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: ['class', '[data-theme="dark"]'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif']
			},
			fontSize: {
				base: '0.875rem' // 87.5% of 16px = 14px
			},
			lineHeight: {
				normal: '1.25'
			},
			maxWidth: {
				'container-sm': '576px',
				'container-md': '748px',
				'container-lg': '1004px'
			}
		}
	},
	plugins: [typography, forms, daisyui],
	daisyui: {
		themes: [
			{
				light: {
					primary: '#0ea5e9', // Sky blue (close to current cyan #1095c1)
					'primary-content': '#ffffff',
					secondary: '#64748b',
					accent: '#37cdbe',
					neutral: '#3d4451',
					'base-100': '#ffffff',
					'base-200': '#f3f4f6',
					'base-300': '#e5e7eb',
					info: '#3abff8',
					success: '#36d399',
					warning: '#fbbd23',
					error: '#f87272'
				},
				dark: {
					primary: '#0ea5e9', // Sky blue (close to current cyan #1095c1)
					'primary-content': '#ffffff',
					secondary: '#64748b',
					accent: '#37cdbe',
					neutral: '#1f2d38',
					'base-100': '#1d232a',
					'base-200': '#191e24',
					'base-300': '#15191e',
					info: '#3abff8',
					success: '#36d399',
					warning: '#fbbd23',
					error: '#f87272'
				}
			}
		],
		darkTheme: 'dark',
		base: true,
		styled: true,
		utils: true
	}
}
