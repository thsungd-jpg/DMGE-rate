const fs = require('fs');

let uiCode = fs.readFileSync('src/components/ui.jsx', 'utf-8');
uiCode = uiCode.replace(/color:\s*["']#2a2a2a["']/g, 'color: "var(--pixel-text, #2a2a2a)"');
fs.writeFileSync('src/components/ui.jsx', uiCode);
console.log("ui.jsx patched.");
