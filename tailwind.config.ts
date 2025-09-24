import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))',
					glass: 'rgba(var(--primary-glass))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))',
					glass: 'rgba(var(--accent-glass))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))',
					border: 'hsl(var(--card-border))',
					glass: 'rgba(var(--card-glass))'
				},
				dashboard: {
					primary: 'hsl(var(--dashboard-primary))',
					'primary-foreground': 'hsl(var(--dashboard-primary-foreground))',
					'primary-glass': 'rgba(var(--dashboard-primary-glass))',
					secondary: 'hsl(var(--dashboard-secondary))',
					'secondary-foreground': 'hsl(var(--dashboard-secondary-foreground))',
					'secondary-glass': 'rgba(var(--dashboard-secondary-glass))'
				},
				success: {
					DEFAULT: 'hsl(var(--success))',
					foreground: 'hsl(var(--success-foreground))',
					glass: 'rgba(var(--success-glass))'
				},
				warning: {
					DEFAULT: 'hsl(var(--warning))',
					foreground: 'hsl(var(--warning-foreground))',
					glass: 'rgba(var(--warning-glass))'
				},
				error: {
					DEFAULT: 'hsl(var(--error))',
					foreground: 'hsl(var(--error-foreground))',
					glass: 'rgba(var(--error-glass))'
				},
				info: {
					DEFAULT: 'hsl(var(--info))',
					foreground: 'hsl(var(--info-foreground))',
					glass: 'rgba(var(--info-glass))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				glass: {
					light: 'rgba(var(--glass-light))',
					medium: 'rgba(var(--glass-medium))',
					strong: 'rgba(var(--glass-strong))',
					'border-light': 'rgba(var(--glass-border-light))',
					'border-medium': 'rgba(var(--glass-border-medium))',
					'border-strong': 'rgba(var(--glass-border-strong))',
					'glow-light': 'rgba(var(--glass-glow-light))',
					'glow-medium': 'rgba(var(--glass-glow-medium))',
					'glow-strong': 'rgba(var(--glass-glow-strong))'
				}
			},
			spacing: {
				'header': 'var(--header-height)',
				'sidebar': 'var(--sidebar-width)'
			},
			backgroundImage: {
				'gradient-primary': 'var(--gradient-primary)',
				'gradient-secondary': 'var(--gradient-secondary)',
				'gradient-smart': 'var(--gradient-smart)',
				'gradient-ai': 'var(--gradient-ai)',
				'gradient-dashboard': 'var(--gradient-dashboard)',
				'gradient-glass-light': 'var(--gradient-glass-light)',
				'gradient-glass-medium': 'var(--gradient-glass-medium)',
				'gradient-glass-radial': 'var(--gradient-glass-radial)'
			},
			boxShadow: {
				'sm': 'var(--shadow-sm)',
				'md': 'var(--shadow-md)',
				'lg': 'var(--shadow-lg)',
				'glow': 'var(--shadow-glow)',
				'smart': 'var(--shadow-smart)',
				'ai': 'var(--shadow-ai)',
				'glass-light': 'var(--shadow-glass-light)',
				'glass-medium': 'var(--shadow-glass-medium)',
				'glass-strong': 'var(--shadow-glass-strong)',
				'glass-glow': 'var(--shadow-glass-glow)',
				'glass-inset': 'var(--shadow-glass-inset)'
			},
			backdropBlur: {
				'glass-light': 'var(--glass-blur-light)',
				'glass-medium': 'var(--glass-blur-medium)',
				'glass-strong': 'var(--glass-blur-strong)',
				'glass-intense': 'var(--glass-blur-intense)'
			},
			backdropSaturate: {
				'glass': 'var(--glass-saturation)'
			},
			backdropBrightness: {
				'glass': 'var(--glass-brightness)'
			},
			transitionProperty: {
				'smooth': 'var(--transition-smooth)',
				'bounce': 'var(--transition-bounce)',
				'glass': 'var(--transition-glass)',
				'morph': 'var(--transition-morph)'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'glass-sm': 'var(--radius-sm)',
				'glass': 'var(--radius)',
				'glass-lg': 'var(--radius-lg)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'liquid-float': {
					'0%, 100%': { 
						transform: 'translateY(0px) rotate(0deg)' 
					},
					'25%': { 
						transform: 'translateY(-3px) rotate(0.5deg)' 
					},
					'50%': { 
						transform: 'translateY(-1px) rotate(-0.5deg)' 
					},
					'75%': { 
						transform: 'translateY(-4px) rotate(0.3deg)' 
					}
				},
				'glass-shimmer': {
					'0%': {
						transform: 'translateX(-100%)'
					},
					'100%': {
						transform: 'translateX(100%)'
					}
				},
				'glass-pulse': {
					'0%, 100%': {
						'backdrop-filter': 'blur(var(--glass-blur-medium)) saturate(var(--glass-saturation))'
					},
					'50%': {
						'backdrop-filter': 'blur(var(--glass-blur-strong)) saturate(200%)'
					}
				},
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(10px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'scale-in': {
					'0%': {
						transform: 'scale(0.95)',
						opacity: '0'
					},
					'100%': {
						transform: 'scale(1)',
						opacity: '1'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'liquid-float': 'liquid-float 8s ease-in-out infinite',
				'glass-shimmer': 'glass-shimmer 2s ease-in-out infinite',
				'glass-pulse': 'glass-pulse 2s ease-in-out infinite',
				'fade-in': 'fade-in 0.3s ease-out',
				'scale-in': 'scale-in 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
