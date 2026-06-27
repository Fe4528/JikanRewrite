const { WebhookClient } = require("discord.js");
const path = require("path");
const webhook = new WebhookClient({
    url: process.env.DEVHOOK_URL
})

function load_locale(locale) {
    let locale_file;

    locale_file = require.cache[path.resolve('../', 'locales', `${locale}.json`)];

    if (locale_file) {
        return locale_file.exports;
    }

    try {
        // if locale exists
        return require(`../locales/${locale}.json`);
    } catch {
        // fallback to en-US
        return require(`../locales/default.json`);
    }
}

const console_colors = {
  default: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

/**
 * Custom Error class for JikanDB related errors
 */
class JikanDBError extends Error {
    constructor(msg) {
        super(msg);

        this.name = "JikanDBError";
        this.date = new Date();
        this.reason = `${this.name}: ${msg}`;

        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, JikanDBError);
        }
    }
}

/**
 * Exports
 */
module.exports.JikanDBError = JikanDBError;

/**
 * Not yet implemented
 * @param {object} payload 
 */
module.exports.dev_log = (payload) => {
    webhook.send(payload);
}

/**
 * Format text as code block
 * @param {string} txt String to format
 */
module.exports.code_block = (txt) => {
    return '```\n'+txt+'\n```'
}

/**
 * Convert milliseconds to readable format
 * @param {number} ms Milliseconds
 * @returns 
 */
module.exports.ms_convert = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const years = Math.floor(days / 365);

    const remaining_days = days % 365;
    const remaining_hours = hours % 24;
    const remaining_minutes = minutes % 60;
    
    const remaining_seconds = ((ms % 60000) / 1000).toFixed(3);
    const final_seconds = parseFloat(remaining_seconds); 

    const duration = [];
    if (years > 0) duration.push(`${years}y`);
    if (remaining_days > 0) duration.push(`${remaining_days}d`);
    if (remaining_hours > 0) duration.push(`${remaining_hours}h`);
    if (remaining_minutes > 0) duration.push(`${remaining_minutes}m`);
    
    if (final_seconds > 0 || duration.length === 0) {
        duration.push(`${final_seconds}s`);
    }

    return duration.join(' ');
}

/**
 * Get the locale translation for a given key.
 * You can just put any gibberish like "sdjakhfjkshfkkjshdf" to make it return the default locale (en-US)
 * @param {object} interaction 
 * @param {string} key
 * @param {'en-US' | 'ja'} locale
 */
module.exports.getLocaleTranslation = function (locale, key, ...vars) {
    const data = load_locale(locale);

    let text = key.split('.').reduce((acc, k) => acc?.[k], data) ?? `${locale}.${key}`;

    return text.replace(/\{(\d+)\}/g, (_, index) => {
        return vars[index] ?? `{${index}}`;
    });
};

/**
 * Template for localization
 * @param {any} key
 * @returns object
 */
module.exports.localizationTemplate = (key) => ({
    'ja': module.exports.getLocaleTranslation('ja', key)
})


/**
 * Generates an ANSI escape code for the given string
 * @param {string} string String to concatenate
 * @param {string} color color or style of string
 * @returns ansi escape code with string concatenated
 */
module.exports.consoleColor = (string, color = 'white') => {
    return `${console_colors[color]}${string}${console_colors.default}`;
}