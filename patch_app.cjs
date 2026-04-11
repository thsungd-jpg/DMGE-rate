const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf-8');

// 1. App Wrapper CSS vars
code = code.replace(
  '<div className="app-wrapper" style={{ minHeight: "100vh", background: CARTRIDGE.bg, fontFamily: "\'Press Start 2P\',monospace", transition: "background 0.3s", paddingBottom: 150 }}>',
  '<div className="app-wrapper" style={{ minHeight: "100vh", background: CARTRIDGE.bg, fontFamily: "\'Press Start 2P\',monospace", transition: "background 0.3s, color 0.3s", paddingBottom: 150, "--pixel-text": activeTheme.modelTextColor, color: "var(--pixel-text, #2a2a2a)" }}>'
);

// 2. Header
code = code.replace(
  'background: activeTheme.roleColor, borderBottom: `0.625rem solid ${CARTRIDGE.border}`, boxShadow: `0 0.625rem 0 ${activeTheme.modelShadow}`',
  'background: activeTheme.catColor, borderBottom: `0.625rem solid ${CARTRIDGE.border}`, boxShadow: `0 0.625rem 0 #aaaaaa`'
);

// 3. PCollapsible activeBg/collapsedColor/modelColor/modelShadow -> catColor and #aaaaaa
code = code.replace(/activeBg=\{activeTheme\.roleColor\}/g, 'activeBg={activeTheme.catColor}');
code = code.replace(/collapsedColor=\{activeTheme\.roleColor\}/g, 'collapsedColor={activeTheme.catColor}');
code = code.replace(/modelShadow=\{activeTheme\.modelShadow\}/g, 'modelShadow="#aaaaaa"');
code = code.replace(/modelColor=\{activeTheme\.modelColor\}/g, 'modelColor={activeTheme.catColor}');

// 4. OptionGrid activeColor -> roleBoxColor
code = code.replace(/activeColor=\{activeTheme\.roleColor\}/g, 'activeColor={activeTheme.roleBoxColor}');
code = code.replace(/activeShadow=\{activeTheme\.modelShadow\}/g, 'activeShadow="#aaaaaa"');

// 5. Hardcoded #2a2a2a -> var(--pixel-text)
code = code.replace(/color: "#2a2a2a"/g, 'color: "var(--pixel-text, #2a2a2a)"');
code = code.replace(/color: '#2a2a2a'/g, 'color: "var(--pixel-text, #2a2a2a)"');

fs.writeFileSync('src/App.jsx', code);
console.log("App.jsx patched.");
