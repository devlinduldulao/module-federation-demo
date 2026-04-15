const fs = require('fs');

function processFile(path, processors) {
    if(!fs.existsSync(path)) return;
    let content = fs.readFileSync(path, 'utf8');
    for(const p of processors) {
        content = content.replace(p.regex, p.replacement);
    }
    fs.writeFileSync(path, content);
}

// 1. Home
processFile('packages/home/src/Home.tsx', [
    { regex: /<div className="w-full mx-auto animate-fade-in"/g, replacement: '<div className="max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-24 animate-fade-in"' },
    { regex: /<header className="mb-16 lg:mb-24 animate-fade-in-up">/g, replacement: '<header className="mb-20 lg:mb-32 animate-fade-in-up">' },
    { regex: /<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"/g, replacement: '<div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"' },
    { regex: /<h2 className="font-display text-5xl lg:text-7xl italic text-cream tracking-tight leading-none mb-4">/g, replacement: '<h2 className="font-display text-6xl lg:text-8xl italic text-cream tracking-tight leading-tight mb-6">' },
    { regex: /<p className="text-stone text-sm max-w-xl leading-relaxed">/g, replacement: '<p className="text-stone text-base max-w-2xl leading-loose">' },
    { regex: /<div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-edge">/g, replacement: '<div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-edge overflow-hidden border border-edge">' },
    { regex: /className="bg-noir p-6 animate-fade-in-up"/g, replacement: 'className="bg-noir p-8 sm:p-12 animate-fade-in-up flex flex-col justify-center min-h-[140px]"' },
    { regex: /<span className="font-display text-xl italic text-cream">/g, replacement: '<span className="font-display text-2xl lg:text-3xl italic text-cream mt-3">' },
    { regex: /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 xl:gap-8">/g, replacement: '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-12">' },
    { regex: /<div className="aspect-\[2\/1\] bg-elevated/g, replacement: '<div className="aspect-[16/9] min-h-[220px] bg-elevated' },
    { regex: /<div className="p-6 flex flex-col flex-1">/g, replacement: '<div className="p-8 sm:p-10 flex flex-col flex-1 h-full min-h-[300px]">' },
    { regex: /<h3 className="font-display text-2xl italic text-cream/g, replacement: '<h3 className="font-display text-3xl lg:text-4xl mb-4 italic text-cream' },
    { regex: /<p className="text-stone text-sm leading-relaxed mb-6 flex-1">/g, replacement: '<p className="text-stone text-base leading-relaxed mb-10 flex-1">' },
    { regex: /className="w-full font-mono text-xs tracking-wider text-citrine border border-edge px-4 py-3 hover:bg-citrine hover:text-ink transition-all duration-300 text-center"/g, replacement: 'className="w-full font-mono text-sm tracking-widest text-citrine border-2 border-edge px-6 py-4 hover:border-citrine hover:bg-citrine hover:text-ink transition-all duration-300 text-center uppercase mt-auto"' }
]);

// 2. Analytics
processFile('packages/analytics/src/ClinicalAnalytics.tsx', [
    { regex: /<div className="w-full mx-auto animate-fade-in"/g, replacement: '<div className="max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-24 animate-fade-in"' },
    { regex: /<header className="mb-12 lg:mb-20 animate-fade-in-up border-b border-edge pb-10">/g, replacement: '<header className="mb-16 lg:mb-24 animate-fade-in-up border-b border-edge pb-12">' },
    { regex: /className="border border-edge p-8 mb-12 animate-fade-in-up"/g, replacement: 'className="border border-edge p-10 sm:p-12 mb-16 animate-fade-in-up shadow-lg"' },
    { regex: /<h3 className="font-display text-2xl italic text-cream">/g, replacement: '<h3 className="font-display text-4xl lg:text-5xl italic text-cream mt-2">' },
    { regex: /<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12"/g, replacement: '<section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-16"' },
    { regex: /className="border border-edge p-6 animate-fade-in-up"/g, replacement: 'className="border border-edge p-8 sm:p-10 animate-fade-in-up flex flex-col justify-center min-h-[180px] shadow-sm"' },
    { regex: /<span className="font-display text-4xl italic text-cream leading-none">/g, replacement: '<span className="font-display text-5xl lg:text-6xl italic text-cream leading-none mt-2">' },
    { regex: /className="border border-edge p-8"/g, replacement: 'className="border border-edge p-10 sm:p-12 shadow-lg"' },
    { regex: /className="flex items-start gap-4 py-4 animate-fade-in-up"/g, replacement: 'className="flex items-start gap-6 py-6 animate-fade-in-up"' }
]);

// 3. Records
processFile('packages/records/src/MedicalRecords.tsx', [
    { regex: /<div className="w-full mx-auto animate-fade-in"/g, replacement: '<div className="max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-24 animate-fade-in"' },
    { regex: /<h2 className="font-display text-5xl lg:text-6xl italic text-cream tracking-tight leading-none mb-3">/g, replacement: '<h2 className="font-display text-6xl lg:text-7xl italic text-cream tracking-tight leading-tight mb-6">' },
    { regex: /<header className="mb-12 lg:mb-20 animate-fade-in-up border-b border-edge pb-10">/g, replacement: '<header className="mb-16 lg:mb-24 animate-fade-in-up border-b border-edge pb-12">' },
    { regex: /className="grid lg:grid-cols-\[350px_1fr\] gap-8"/g, replacement: 'className="grid lg:grid-cols-[400px_1fr] gap-12 lg:gap-16"' },
    { regex: /className="border border-edge p-6 mb-8"/g, replacement: 'className="border border-edge p-8 sm:p-10 mb-12 shadow-lg"' },
    { regex: /className="flex items-center gap-4 p-4 border border-edge"/g, replacement: 'className="flex flex-col sm:flex-row items-start sm:items-center gap-6 p-6 border border-edge shadow-sm"' }
]);

// 4. Prescriptions
processFile('packages/prescriptions/src/PrescriptionOrders.tsx', [
    { regex: /<div className="w-full mx-auto animate-fade-in"/g, replacement: '<div className="max-w-7xl w-full mx-auto px-6 sm:px-8 lg:px-12 py-12 lg:py-24 animate-fade-in"' },
    { regex: /<h2 className="font-display text-5xl lg:text-6xl italic text-cream tracking-tight leading-none mb-3">/g, replacement: '<h2 className="font-display text-6xl lg:text-7xl italic text-cream tracking-tight leading-tight mb-6">' },
    { regex: /<header className="mb-12 lg:mb-20 animate-fade-in-up border-b border-edge pb-10">/g, replacement: '<header className="mb-16 lg:mb-24 animate-fade-in-up border-b border-edge pb-12">' },
    { regex: /<div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"/g, replacement: '<div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"' },
    { regex: /className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-edge mb-12"/g, replacement: 'className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-edge mb-16 shadow-lg border border-edge overflow-hidden"' },
    { regex: /className="bg-noir p-6 animate-fade-in-up"/g, replacement: 'className="bg-noir p-8 sm:p-10 animate-fade-in-up flex flex-col justify-center min-h-[140px]"' },
    { regex: /<div className="space-y-4">/g, replacement: '<div className="space-y-6 sm:space-y-8">' },
    { regex: /className="border border-edge p-6 animate-fade-in-up"/g, replacement: 'className="border border-edge p-8 sm:p-10 animate-fade-in-up shadow-md"' },
    { regex: /className="font-display text-2xl italic text-cream"/g, replacement: 'className="font-display text-3xl lg:text-4xl italic text-cream mb-2"' }
]);
