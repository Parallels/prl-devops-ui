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
            animation: {
                'flow-dot': 'flow-dot 1.4s ease-in-out infinite',
                'loader-wipe': 'loader-wipe 1.8s linear infinite',
                'progress-stripes': 'progress-stripes 1.2s linear infinite',
            },
        },
    },
    plugins: [
        // All keyframes live in addBase so they are always emitted regardless of
        // whether the class is used via a named utility or an arbitrary value.
        // theme.extend.keyframes is NOT used — Tailwind only emits those when it
        // scans a named animate-* class in content, which arbitrary variants bypass.
        plugin(({ addBase, addUtilities }) => {
            addBase({
                '@keyframes fadeIn': {
                    from: { opacity: '0', transform: 'translateY(2px)' },
                    to:   { opacity: '1', transform: 'translateY(0)' },
                },
                '@keyframes flow-dot': {
                    '0%':   { opacity: '0', transform: 'translateX(-6px)' },
                    '25%':  { opacity: '1', transform: 'translateX(0)' },
                    '75%':  { opacity: '1', transform: 'translateX(0)' },
                    '100%': { opacity: '0', transform: 'translateX(6px)' },
                },
                '@keyframes loader-wipe': {
                    '0%':   { transform: 'translateX(-120%)' },
                    '100%': { transform: 'translateX(120%)' },
                },
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
                // InfoRow: row flash on copy (hoverable mode)
                // Flashes bright emerald then returns to 0 so the static bg-emerald-50/60
                // class shows underneath as the steady-state after the animation completes.
                '@keyframes copied-flash': {
                    '0%':   { backgroundColor: 'rgba(52,211,153,0)',    transform: 'scaleX(1)' },
                    '15%':  { backgroundColor: 'rgba(52,211,153,0.28)', transform: 'scaleX(1.012)' },
                    '40%':  { backgroundColor: 'rgba(52,211,153,0.18)', transform: 'scaleX(1.006)' },
                    '100%': { backgroundColor: 'rgba(52,211,153,0)',    transform: 'scaleX(1)' },
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
                '.animate-copied-flash': {
                    'animation': 'copied-flash 0.7s ease-out',
                    'transform-origin': 'center',
                },
            });
        }),
    ],
}
