const { WebhookClient } = require("discord.js")
const webhook = new WebhookClient({
    url: process.env.DEVHOOK_URL
})
const locale_cache = {};

function load_locale(locale) {
    if (locale_cache[locale]) {
        return locale_cache[locale];
    }

    try {
        locale_cache[locale] = require(`./locales/${locale}.json`);
    } catch {
        locale_cache[locale] = require(`./locales/default.json`);
    }

    return locale_cache[locale];
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
 * Check if command is a dev command
 * @param {string} command 
 * @param {Array} dev_list 
 * @returns 
 */
module.exports.is_devcommand = (command, dev_list) => {
    return dev_list.includes(command);
}

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
    const seconds = ms / 1000;
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const years = Math.floor(days / 365);

    const remainingDays = days % 365;
    const remainingHours = hours % 24;
    const remainingMinutes = minutes % 60;
    const remainingSeconds = (seconds % 60).toFixed(3);

    const duration = [];
    if (years > 0) {
        duration.push(`${years}y`)
    }
    if (remainingDays > 0) {
        duration.push(`${remainingDays}d`)
    }
    if (remainingHours > 0) {
     duration.push(`${remainingHours}h`)
    }
    if (remainingMinutes > 0) {
        duration.push(`${remainingMinutes}m`)
    }
    if (remainingSeconds >= 0) {
        duration.push(`${remainingSeconds}s`)
    }

    return duration.join(' ');
}

/**
 * Strings for leaderboards (should be on localization json tbh)
 */
module.exports.order_strings = {
    'asc': 'Ascending',
    'desc': 'Descending'
}

/**
 * Strings for leaderboards (should be on localization json tbh)
 */
module.exports.value_strings = {
    'vc_time': 'VC Time',
    'user_id': 'User ID',
    'user_name': 'User Name'
}

/**
 * Get the locale translation for a given key.
 * You can just put any gibberish like "sdjakhfjkshfkkjshdf" to make it return the default locale (en-US)
 * @param {object} interaction 
 * @param {string} key 
 */
module.exports.getLocaleTranslation = function (locale, key, ...vars) {
    const data = load_locale(locale);

    let text = key.split('.').reduce((acc, k) => acc?.[k], data) ?? `not_found`;

    return text.replace(/\{(\d+)\}/g, (_, index) => {
        return vars[index] ?? `{${index}}`;
    });
};

module.exports.localizationTemplate = (key) => ({
    'ja': module.exports.getLocaleTranslation('ja', key)
})