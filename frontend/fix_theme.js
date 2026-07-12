const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// Features
content = content.replace(/bg-\[#111624\]/g, 'bg-white dark:bg-[#111624]');
content = content.replace(/bg-slate-900\/50/g, 'bg-slate-100 dark:bg-slate-900/50');
content = content.replace(/border-slate-800/g, 'border-slate-200 dark:border-slate-800');
content = content.replace(/text-white/g, 'text-slate-900 dark:text-white');
content = content.replace(/bg-slate-800 rounded-full/g, 'bg-slate-200 dark:bg-slate-800 rounded-full');

// Transfer Market
content = content.replace(/bg-\[#151A28\]/g, 'bg-white dark:bg-[#151A28]');
content = content.replace(/hover:border-slate-700/g, 'hover:border-slate-300 dark:hover:border-slate-700');
content = content.replace(/bg-slate-800 rounded/g, 'bg-slate-100 dark:bg-slate-800 rounded');
content = content.replace(/border-slate-700/g, 'border-slate-200 dark:border-slate-700');
content = content.replace(/text-slate-300 bg-slate-800\/50 hover:bg-slate-700\/50/g, 'text-slate-700 dark:text-slate-300 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200/50 dark:hover:bg-slate-700/50');

// Hero secondary buttons
content = content.replace(/bg-slate-800\/80 hover:bg-slate-700\/80 text-white/g, 'bg-slate-200/80 dark:bg-slate-800/80 hover:bg-slate-300/80 dark:hover:bg-slate-700/80 text-slate-900 dark:text-white');

// Pricing Toggle
content = content.replace(/bg-slate-900\/80/g, 'bg-slate-200/80 dark:bg-slate-900/80');

// Fix Player Plan button
content = content.replace(/bg-slate-800 hover:bg-slate-700 text-slate-900 dark:text-white/g, 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white');

// Ensure text-slate-200 becomes dark:text-slate-200
content = content.replace(/text-slate-200/g, 'text-slate-800 dark:text-slate-200');

fs.writeFileSync('src/app/page.tsx', content);
