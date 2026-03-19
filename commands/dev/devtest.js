const { SlashCommandBuilder } = require('discord.js');
const { getLocaleTranslation } = require('../../static/utils.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('devtest')
    .setDescription(getLocaleTranslation('en-US', 'commands.dev.devtest.description'))
    .setDescriptionLocalizations({
        "ja": getLocaleTranslation("ja", "commands.dev.devtest.description")
    }),
    async run(discord, client, interaction) {
        interaction.reply("dev test");
        // sdkjmfhkjdshf
    }
}