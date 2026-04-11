const fs = require('fs');
const path = require('path');

const files = [
  'src/App.jsx',
  'src/components/ui.jsx',
  'src/components/PricingPage.jsx',
  'src/components/UpgradeModal.jsx',
  'src/components/ClientManager.jsx',
  'src/components/TemplateManager.jsx',
  'src/components/AnalyticsDashboard.jsx'
];

function toRem(pxStr) {
  const parsed = parseFloat(pxStr);
  if (isNaN(parsed) || parsed === 0) return '0';
  return (parsed / 16) + 'rem';
}

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
    
  // Find any string with "px" that might have been missed
  content = content.replace(/(-?\d+)px/g, (m, val) => toRem(val));

  fs.writeFileSync(filePath, content);
});

console.log("Refactoring complete");
