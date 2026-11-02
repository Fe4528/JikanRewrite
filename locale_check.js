const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'locales');
const base = JSON.parse(fs.readFileSync(path.join(dir, 'default.json'), 'utf8'));

function flatten(obj, prefix = '', out = {}) {
    for (const [k, v] of Object.entries(obj)) {
        if (k.startsWith('_')) continue;

        const key = prefix ? `${prefix}.${k}` : k;

        if (v && typeof v === 'object') flatten(v, key, out);
        else out[key] = v;
    }

    return out;
}

function placeholders(str) {
    return typeof str === 'string'
        ? [...str.matchAll(/\{(\d+)\}/g)].map(m => m[1]).sort().join(',')
        : '';
}

function list(items) {
    return items.length ? items.map(k => `  - ${k}`).join('\n') : '  none';
}

const base_flat = flatten(base);
const reports = [];

console.log('reference is default.json\n');

for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith('.json') || file === 'default.json') continue;

    const flat = flatten(JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8')));

    reports.push({
        file,
        missing: Object.keys(base_flat).filter(k => !(k in flat)),
        extra: Object.keys(flat).filter(k => !(k in base_flat)),
        mismatched: Object.keys(flat).filter(k => k in base_flat && placeholders(flat[k]) !== placeholders(base_flat[k]))
    });
}

const blocks = reports.map(r => [
    `[${r.file}]`,
    `missing count: ${r.missing.length}`,
    `extra:\n${list(r.extra)}`,
    `mismatched:\n${list(r.mismatched)}`
].join('\n'));

console.log(blocks.join('\n\n') + '\n');

const actions = reports
    .filter(r => r.missing.length || r.extra.length || r.mismatched.length)
    .map(r => [
        `[${r.file}]`,
        ...r.missing.map(k => `  missing     ${k}`),
        ...r.extra.map(k => `  extra       ${k}`),
        ...r.mismatched.map(k => `  mismatched  ${k}`)
    ].join('\n'));

console.log('KEYS THAT NEED ACTION');
console.log(actions.length ? actions.join('\n\n') : 'none');