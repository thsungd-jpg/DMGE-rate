const fs = require('fs');

// Patch ui.jsx
let uiCode = fs.readFileSync('src/components/ui.jsx', 'utf-8');
uiCode = uiCode.replace(/"#e0e0e0"/g, '"var(--pixel-surface, #e0e0e0)"');
fs.writeFileSync('src/components/ui.jsx', uiCode);

// Patch App.jsx
let appCode = fs.readFileSync('src/App.jsx', 'utf-8');
// Inject CSS var into the wrapper
appCode = appCode.replace(
  '"--pixel-text": "#2a2a2a"',
  '"--pixel-text": "#2a2a2a", "--pixel-surface": activeTheme.roleBoxColor'
);
fs.writeFileSync('src/App.jsx', appCode);

console.log('patched grey boxes to role color');
