const { SlashCommandBuilder } = require('discord.js');
const { getLocaleTranslation, localizationTemplate } = require('../../static/utils.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.dev.devtest.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.dev.devtest.description')),
    async run(discord, client, interaction) {
        interaction.reply("dev test");
    }
}