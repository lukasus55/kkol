const fs = require('fs');

let css = fs.readFileSync('app/globals.css', 'utf-8');

const footerFont = @font-face 
{
    font-family: 'Lexend';
    src: url("/fonts/Lexend/Lexend-VariableFont_wght.ttf");
};
css = css.replace(footerFont, '');

const newRoot = :root {
    /* Backgrounds - White to Light Gray */
    --color-bg-100: #ffffff;
    --color-bg-200: #f8fafc;
    --color-bg-300: #f1f5f9;
    --color-bg-400: #e2e8f0;
    --color-bg-500: #cbd5e1;
    --color-bg-600: #94a3b8;
    
    /* Text - Navy Black to Gray */
    --color-text-900: #0f172a;
    --color-text-700: #334155;
    --color-text-500: #64748b;
    
    /* Accent - Neon Teal */
    --color-accent-400: #2dd4bf; 
    --color-accent-500: #14b8a6;
    --color-accent-600: #0d9488;
    
    /* Others */
    --color-danger-500: #ef4444;
    --color-danger-600: #dc2626;
    
    --color-warning-red: #b42525;
    --color-overlay: rgba(0, 0, 0, 0.7);
  };

css = css.replace(/:root\s*{[^}]*--dashboard-background:[^}]*}/s, newRoot);
css = css.replace(/:root\s*{[^}]*--color-onyx:[^}]*}/s, '');
css = css.replace(/:root\s*{[^}]*--footer700:[^}]*}/s, '');

css = css.replace('background: var(--color-onyx);', 'background: var(--color-bg-100);');
css = css.replace('color: var(--color-lavender-mist);', 'color: var(--color-text-900);');
css = css.replace('background-color: var(--footer50);', 'background-color: var(--color-bg-200);');
css = css.replace('color: #ffffff;', 'color: var(--color-text-900);');

fs.writeFileSync('app/globals.css', css);

let tw = fs.readFileSync('tailwind.config.ts', 'utf-8');
const newColors = colors: {
        'lime-moss': 'var(--color-accent-500)',
        'charcoal-blue': 'var(--color-bg-200)',
        'lavender-mist': 'var(--color-text-900)',
        'onyx': 'var(--color-bg-100)',
        'dashboard-bg': 'var(--color-bg-100)',
        'dashboard-bg-s2': 'var(--color-bg-200)',
        'dashboard-bg-s3': 'var(--color-bg-300)',
        'dashboard-bg-s4': 'var(--color-bg-400)',
        'dashboard-bg-s5': 'var(--color-bg-500)',
        'dashboard-bg-s6': 'var(--color-bg-600)',
        'dashboard-stroke': 'var(--color-bg-400)',
        'dashboard-text': 'var(--color-text-900)',
        'dashboard-text-s2': 'var(--color-text-700)',
        'dashboard-text-s3': 'var(--color-text-500)',
        'dashboard-primary': 'var(--color-accent-500)',
        'dashboard-primary-hover': 'var(--color-accent-600)',
        'dashboard-danger': 'var(--color-danger-500)',
        'dashboard-danger-hover': 'var(--color-danger-600)',
      },;
tw = tw.replace(/colors:\s*{[^}]*},/s, newColors);
fs.writeFileSync('tailwind.config.ts', tw);
