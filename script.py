import re

with open('app/globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

# 1. Remove @font-face from footer (duplicate)
footer_font = '''@font-face 
{
    font-family: 'Lexend';
    src: url("/fonts/Lexend/Lexend-VariableFont_wght.ttf");
}'''
css = css.replace(footer_font, '')

# 2. Update :root in globals.css @layer base
new_root = ''':root {
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
  }'''
css = re.sub(r':root\s*{[^}]*--dashboard-background:[^}]*}', new_root, css, count=1, flags=re.DOTALL)

# 3. Remove old :root from base.css
css = re.sub(r':root\s*{[^}]*--color-onyx:[^}]*}', '', css, count=1, flags=re.DOTALL)

# 4. Remove old :root from footer.css
css = re.sub(r':root\s*{[^}]*--footer700:[^}]*}', '', css, count=1, flags=re.DOTALL)

# 5. Update body colors
css = css.replace('background: var(--color-onyx);', 'background: var(--color-bg-100);')
css = css.replace('color: var(--color-lavender-mist);', 'color: var(--color-text-900);')

# 6. Update footer background to match new theme (optional, but requested light theme)
# Footer was using var(--footer50) which was #141212. Let's make it --color-bg-200.
css = css.replace('background-color: var(--footer50);', 'background-color: var(--color-bg-200);')
css = css.replace('color: #ffffff;', 'color: var(--color-text-900);')

with open('app/globals.css', 'w', encoding='utf-8') as f:
    f.write(css)

with open('tailwind.config.ts', 'r', encoding='utf-8') as f:
    tw = f.read()

# Update tailwind config colors
new_colors = '''colors: {
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
      },'''
tw = re.sub(r'colors:\s*{[^}]*},', new_colors, tw, count=1, flags=re.DOTALL)

with open('tailwind.config.ts', 'w', encoding='utf-8') as f:
    f.write(tw)
