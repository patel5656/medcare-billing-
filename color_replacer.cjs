const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src/components/packets');

const burgundyText = 'text-[#722F37]';
const burgundyBg = 'bg-[#722F37]';
const burgundyBorder = 'border-[#722F37]';
const blushBg = 'bg-[#F9ECEC]';
const blushBorder = 'border-[#E8D3D3]';

const replacements = [
  // Indigo / Slate / Rose / Blue / Teal primary headers/accents -> Burgundy
  { regex: /text-(indigo|blue|teal|rose|gray|slate)-(700|800|900)/g, replace: burgundyText },
  { regex: /bg-(indigo|blue|teal|rose|gray|slate)-(700|800|900)/g, replace: burgundyBg },
  { regex: /border-(indigo|blue|teal|rose|gray|slate)-(700|800|900)/g, replace: burgundyBorder },
  
  // Secondary / Subtle backgrounds -> Blush
  { regex: /bg-(indigo|blue|teal|rose|gray|slate)-(50|100)/g, replace: blushBg },
  
  // Subtle borders -> Blush border
  { regex: /border-(indigo|blue|teal|rose|gray|slate)-(200|300)/g, replace: blushBorder },

  // Table headers (usually bg-slate-100 or bg-gray-200) -> Burgundy bg and white text
  { regex: /bg-(slate|gray)-(100|200)\s+text-(slate|gray)-(700|800)/g, replace: `${burgundyBg} text-white` },
  { regex: /bg-(slate|gray)-(100|200)/g, replace: blushBg },
  
  // Keep regular text (slate-600, 500, etc) readable but maybe change focus rings
  { regex: /focus:ring-(indigo|blue|teal|rose)-(400|500)/g, replace: `focus:ring-[#722F37]` },
  { regex: /focus:border-(indigo|blue|teal|rose)-(400|500)/g, replace: `focus:border-[#722F37]` },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'ai') { // Do not touch AI folder
        processDirectory(fullPath);
      }
    } else if (fullPath.endsWith('.jsx') && file !== 'UnifiedPacketViewer.jsx' && file !== 'EditableClinicalField.jsx') {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Specifically target forms, replace colors safely
      // However, text-slate-800 and text-slate-900 are often used for normal body text. 
      // We should NOT change ALL text-slate-900 to burgundy, otherwise the whole document turns red.
      // The instruction: "Deep Burgundy / Wine for primary headers, section bars, table headers, borders, and strong accents"
      // "White / Light Neutral for main form/document backgrounds"
      // "Keep text readable and professional"
      
      // Let's use a safer set of replacements:
      let newContent = content;
      
      // Replace only specific highlight colors (rose, indigo, blue, teal) which are used for headers/accents in current forms
      newContent = newContent.replace(/text-(rose|indigo|blue|teal)-(700|800|900)/g, burgundyText);
      newContent = newContent.replace(/bg-(rose|indigo|blue|teal)-(700|800|900)/g, burgundyBg);
      newContent = newContent.replace(/border-(rose|indigo|blue|teal)-(700|800|900)/g, burgundyBorder);
      
      newContent = newContent.replace(/bg-(rose|indigo|blue|teal)-(50|100)/g, blushBg);
      newContent = newContent.replace(/border-(rose|indigo|blue|teal)-(200|300)/g, blushBorder);
      
      newContent = newContent.replace(/focus:ring-(rose|indigo|blue|teal)-(400|500)/g, 'focus:ring-[#722F37]');
      newContent = newContent.replace(/focus:border-(rose|indigo|blue|teal)-(400|500)/g, 'focus:border-[#722F37]');
      newContent = newContent.replace(/focus:bg-(rose|indigo|blue|teal)-(50|100)/g, `focus:${blushBg}`);
      
      // For gray/slate, usually headers are font-bold or font-black. 
      // We will replace table headers and prominent sections.
      // e.g. bg-slate-900 text-white -> bg-[#722F37] text-white
      newContent = newContent.replace(/bg-slate-900 text-white/g, `${burgundyBg} text-white`);
      newContent = newContent.replace(/bg-slate-800 text-white/g, `${burgundyBg} text-white`);
      
      // Replace table header backgrounds (bg-slate-100 font-bold -> bg-[#722F37] text-white)
      // Actually, regexing this is hard. Let's just swap bg-slate-100 with blushBg if it's a section wrapper,
      // but if it's a table header, it might need to be burgundy.
      // The prompt says: "Deep Burgundy / Wine for primary headers, section bars, table headers..."
      // Let's find "bg-slate-100" and "bg-slate-50" inside tables.
      newContent = newContent.replace(/<thead className="bg-slate-100/g, `<thead className="${burgundyBg} text-white`);
      newContent = newContent.replace(/<thead className="bg-slate-50/g, `<thead className="${burgundyBg} text-white`);
      newContent = newContent.replace(/<th className="([^"]*)text-slate-[56789]00/g, `<th className="$1text-white`);
      
      // Other generic section bars that are currently slate:
      newContent = newContent.replace(/border-slate-800/g, burgundyBorder);
      newContent = newContent.replace(/border-slate-900/g, burgundyBorder);
      
      fs.writeFileSync(fullPath, newContent, 'utf8');
      console.log(`Processed: ${file}`);
    }
  }
}

processDirectory(directoryPath);
