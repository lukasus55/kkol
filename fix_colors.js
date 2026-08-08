const fs = require('fs');
const path = require('path');

const skipFiles = [
    'Button.tsx',
    'ErrorPopup.tsx',
    'ConfirmationPopup.tsx', 
    'ToastProvider.tsx',
    'TournamentSettingsTab.tsx',
    'Tooltip.tsx'
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if(file.endsWith('.tsx') && !skipFiles.includes(path.basename(file))) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk('components');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace classes globally in the file
    content = content.replace(/text-white/g, 'text-dashboard-text');
    content = content.replace(/hover:bg-white\/5/g, 'hover:bg-dashboard-bg-s2');
    content = content.replace(/hover:bg-white\/10/g, 'hover:bg-dashboard-bg-s3');
    content = content.replace(/hover:bg-white\/20/g, 'hover:bg-dashboard-bg-s4');
    
    content = content.replace(/bg-white\/5/g, 'bg-dashboard-bg-s2');
    content = content.replace(/bg-white\/10/g, 'bg-dashboard-bg-s3');
    content = content.replace(/bg-white\/20/g, 'bg-dashboard-bg-s4');
    
    content = content.replace(/border-white\/5/g, 'border-dashboard-stroke');
    content = content.replace(/hover:border-white\/20/g, 'hover:border-dashboard-stroke');
    
    fs.writeFileSync(file, content);
});

console.log('Done replacements in ' + files.length + ' files.');
