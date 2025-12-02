const { WebhookClient } = require("discord.js")
const webhook = new WebhookClient({
    url: process.env.DEVHOOK_URL
})
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

module.exports.JikanDBError = JikanDBError;

module.exports.is_devcommand = (command, dev_list) => {
    return dev_list.includes(command);
}

module.exports.dev_log = (payload) => {
    webhook.send(payload);
}

module.exports.code_block = (txt) => {
    return '```\n'+txt+'\n```'
}

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