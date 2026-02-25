/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./packages/ui-kit/src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            keyframes: {
                fadeIn: {
                    from: { opacity: '0', transform: 'translateY(2px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' },
                },
                'flow-dot': {
                    '0%':   { opacity: '0', transform: 'translateX(-6px)' },
                    '25%':  { opacity: '1', transform: 'translateX(0)' },
                    '75%':  { opacity: '1', transform: 'translateX(0)' },
                    '100%': { opacity: '0', transform: 'translateX(6px)' },
                },
            },
            animation: {
                'flow-dot': 'flow-dot 1.4s ease-in-out infinite',
            },
        },
    },
    plugins: [
        // Icon animation classes — keyframes emitted via addBase (always included, never purged),
        // classes via addUtilities with transform-box/origin bundled so SVG elements rotate around
        // their own center rather than the viewport origin.
        plugin(({ addBase, addUtilities }) => {
            addBase({
                '@keyframes icon-pulse': {
                    '0%, 100%': { transform: 'scale(1)',    opacity: '1' },
                    '50%':      { transform: 'scale(1.25)', opacity: '0.75' },
                },
                '@keyframes icon-rock': {
                    '0%':   { transform: 'rotate(0deg)' },
                    '25%':  { transform: 'rotate(45deg)' },
                    '50%':  { transform: 'rotate(0deg)' },
                    '75%':  { transform: 'rotate(-45deg)' },
                    '100%': { transform: 'rotate(0deg)' },
                },
            });
            addUtilities({
                '.animate-icon-pulse': {
                    'animation': 'icon-pulse 1.5s ease-in-out infinite',
                    'transform-box': 'fill-box',
                    'transform-origin': 'center',
                },
                '.animate-icon-rock': {
                    'animation': 'icon-rock 1.2s ease-in-out infinite',
                    'transform-box': 'fill-box',
                    'transform-origin': 'center',
                },
            });
        }),
    ],
}
