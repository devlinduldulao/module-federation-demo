const fs = require('fs');

function processFile(path, processors) {
    if(!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for(const p of processors) {
        content = content.replace(p.regex, p.replacement);
    }
    fs.writeFileSync(path, content);
}

processFile('packages/shell/src/App.tsx', [
    { regex: /<nav className="border-b border-edge px-6 py-4 flex items-center justify-between">/g, replacement: '<nav className="border-b border-edge px-8 sm:px-12 py-6 flex items-center justify-between shadow-sm sticky top-0 z-30 bg-noir/90 backdrop-blur-md">' },
    { regex: /<main className="flex-1 relative pb-12">/g, replacement: '<main className="flex-1 relative pb-20 pt-4 px-4 sm:px-8">' }
]);

console.log('done2');
