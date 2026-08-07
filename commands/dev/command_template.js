const { SlashCommandBuilder } = require('discord.js');
const { getLocaleTranslation, localizationTemplate } = require('#jikan/utils.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.dev.devtest.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.dev.devtest.description')),
    async run(client, interaction) {
        try {
            // code goes here
        } catch (e) {
            interaction.reply(`${getLocaleTranslation(server_locale, 'system.command_error')}\n${code_block(e.message)}`);
        }
    }
}