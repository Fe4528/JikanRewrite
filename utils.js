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