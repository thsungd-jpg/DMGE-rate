const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. App Wrapper CSS vars: revert --pixel-text to #2a2a2a
code = code.replace(
  '"--pixel-text": activeTheme.modelTextColor',
  '"--pixel-text": "#2a2a2a"'
);

// 2. Header shadow: #aaaaaa -> activeTheme.modelShadow
code = code.replace(
  'borderBottom: `0.625rem solid ${CARTRIDGE.border}`, boxShadow: `0 0.625rem 0 #aaaaaa`',
  'borderBottom: `0.625rem solid ${CARTRIDGE.border}`, boxShadow: `0 0.625rem 0 ${activeTheme.modelShadow}`'
);

// 3. PCollapsible modelShadow -> activeTheme.modelShadow
code = code.replace(/modelShadow="#aaaaaa"/g, 'modelShadow={activeTheme.modelShadow}');

// 4. OptionGrid activeShadow -> activeTheme.modelShadow
code = code.replace(/activeShadow="#aaaaaa"/g, 'activeShadow={activeTheme.modelShadow}');

fs.writeFileSync('src/App.jsx', code);
console.log("App.jsx patched for shadows.");
