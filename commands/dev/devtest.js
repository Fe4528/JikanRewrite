const { SlashCommandBuilder } = require('discord.js');
const { getLocaleTranslation, localizationTemplate } = require('../../static/utils.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('devtest')
    .setDescription(getLocaleTranslation('en-US', 'commands.dev.devtest.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.dev.devtest.description')),
    async run(discord, client, interaction) {
        interaction.reply("dev test");
    }
}