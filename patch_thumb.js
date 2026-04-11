const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf-8');

const oldThumb = 'input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:2.5rem;height:2.5rem;background:${activeTheme.roleColor};border:0.5rem solid #2a2a2a;border-radius:0;cursor:pointer;}';

const newThumb = `input[type=range]::-webkit-slider-thumb{
  -webkit-appearance:none;
  width:2.5rem;
  height:2.5rem;
  background-color:\${activeTheme.roleBoxColor || activeTheme.roleColor};
  background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="7" y="1" width="2" height="14" fill="%232a2a2a"/><rect x="5" y="3" width="6" height="2" fill="%232a2a2a"/><rect x="4" y="5" width="2" height="2" fill="%232a2a2a"/><rect x="5" y="7" width="6" height="2" fill="%232a2a2a"/><rect x="10" y="9" width="2" height="2" fill="%232a2a2a"/><rect x="5" y="11" width="6" height="2" fill="%232a2a2a"/></svg>');
  background-size: 70% 70%;
  background-position: center;
  background-repeat: no-repeat;
  border:0.5rem solid #2a2a2a;
  border-radius:0;
  cursor:pointer;
}`;

// There might be -moz-range-thumb too
const oldMoz = 'input[type=range]::-moz-range-thumb{-webkit-appearance:none;width:2.5rem;height:2.5rem;background:${activeTheme.roleColor};border:0.5rem solid #2a2a2a;border-radius:0;cursor:pointer;}';

const newMoz = `input[type=range]::-moz-range-thumb{
  -webkit-appearance:none;
  width:2.5rem;
  height:2.5rem;
  background-color:\${activeTheme.roleBoxColor || activeTheme.roleColor};
  background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect x="7" y="1" width="2" height="14" fill="%232a2a2a"/><rect x="5" y="3" width="6" height="2" fill="%232a2a2a"/><rect x="4" y="5" width="2" height="2" fill="%232a2a2a"/><rect x="5" y="7" width="6" height="2" fill="%232a2a2a"/><rect x="10" y="9" width="2" height="2" fill="%232a2a2a"/><rect x="5" y="11" width="6" height="2" fill="%232a2a2a"/></svg>');
  background-size: 70% 70%;
  background-position: center;
  background-repeat: no-repeat;
  border:0.5rem solid #2a2a2a;
  border-radius:0;
  cursor:pointer;
}`;

code = code.replace(oldThumb, newThumb);
code = code.replace(oldMoz, newMoz);

fs.writeFileSync('src/App.jsx', code);
console.log("slider thumb patched.");
