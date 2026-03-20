const path = require('path');
const chokidar = require('chokidar');
const { consoleColor } = require('./static/utils.js');

const dirs = [
    './commands/dev',
    './commands/public',
    './events',
    './locales',
    './static'
];

const watcher = chokidar.watch(dirs, {
    ignored: /(^|[\/\\])\./,
    persistent: true
})

watcher.on('ready', () => {
    console.log(consoleColor(`Hot reload module is ready`, 'cyan'));
})

function clear_cache(f_path) {
    try {
        const resolved = require.resolve(f_path);

        if (require.cache[resolved]) {
            delete require.cache[resolved];
            require(resolved);
        }
    } catch(e) {
        throw new Error(e.message);
    }
}

watcher.on('change', file_name => {
    if (file_name.endsWith('.js') || file_name.endsWith('.json')) {
        const real_path = path.join(__dirname, file_name);
        console.log(consoleColor(`File [${real_path}] changes detected; refreshing...`, 'cyan'));
        clear_cache(real_path);
    }
})
