# ============================================================
# build.py — Python build script to generate dist/index.html
# Run: python build.py
# ============================================================

import os

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
os.makedirs(DIST, exist_ok=True)

# 1. Read index.html
with open(os.path.join(ROOT, 'index.html'), 'r', encoding='utf-8') as f:
    html = f.read()

# 2. Read and inline CSS
css_files = ['css/main.css', 'css/animations.css']
all_css = ''
for fname in css_files:
    fpath = os.path.join(ROOT, fname)
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            all_css += f.read() + '\n'

# Replace CSS link tags
css_link_pattern = '<link rel="stylesheet" href="css/main.css">\n  <link rel="stylesheet" href="css/animations.css">'
if css_link_pattern in html:
    html = html.replace(css_link_pattern, '<style>' + all_css + '</style>')
else:
    # Try single-line variant
    css_link_pattern2 = '<link rel="stylesheet" href="css/main.css"> <link rel="stylesheet" href="css/animations.css">'
    if css_link_pattern2 in html:
        html = html.replace(css_link_pattern2, '<style>' + all_css + '</style>')
    else:
        print('WARNING: Could not find CSS link tags pattern')

# 3. Concatenate JS files in order
js_files = [
    'js/utils.js',
    'js/db.js',
    'js/state.js',
    'js/ai.js',
    'js/components/calendar-strip.js',
    'js/components/search-bar.js',
    'js/components/voice-recorder.js',
    'js/components/image-uploader.js',
    'js/components/note-card.js',
    'js/components/timeline.js',
    'js/components/tab-bar.js',
    'js/components/charts.js',
    'js/pages/home.js',
    'js/pages/memory-bank.js',
    'js/pages/profile.js',
    'js/app.js',
]

all_js = ''
for fname in js_files:
    fpath = os.path.join(ROOT, fname)
    if os.path.exists(fpath):
        with open(fpath, 'r', encoding='utf-8') as f:
            all_js += '\n// ====== ' + fname + ' ======\n'
            all_js += f.read() + '\n'
    else:
        print('WARNING: ' + fname + ' not found')

# Simple string replacement for the JS marker
html = html.replace('<!-- BUILT_JS -->', '<script>' + all_js + '</script>')

# 4. Copy manifest.json
manifest_src = os.path.join(ROOT, 'manifest.json')
if os.path.exists(manifest_src):
    with open(manifest_src, 'r', encoding='utf-8') as f:
        manifest_content = f.read()
    with open(os.path.join(DIST, 'manifest.json'), 'w', encoding='utf-8') as f:
        f.write(manifest_content)

# 5. Copy sw.js
sw_src = os.path.join(ROOT, 'sw.js')
if os.path.exists(sw_src):
    with open(sw_src, 'r', encoding='utf-8') as f:
        sw_content = f.read()
    with open(os.path.join(DIST, 'sw.js'), 'w', encoding='utf-8') as f:
        f.write(sw_content)

# 6. Write output
output_path = os.path.join(DIST, 'index.html')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html)

size_kb = os.path.getsize(output_path) / 1024
print('Build complete: dist/index.html (' + str(round(size_kb, 1)) + ' KB)')
print('  ' + str(len(css_files)) + ' CSS files inlined')
print('  ' + str(len(js_files)) + ' JS files bundled')
print('')
print('Deploy the dist/ folder to any static host, or serve with:')
print('  python -m http.server 8080 -d dist')
