const { SlashCommandBuilder } = require('discord.js');
const { getLocaleTranslation, localizationTemplate} = require('../../static/utils.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.dev.localetest.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.dev.localetest.description')),
    async run(discord, client, interaction) {
        console.log(interaction.locale);
        interaction.reply({
            embeds: [
                new discord.EmbedBuilder()
                .setTitle(getLocaleTranslation('en-US', 'commands.dev.localetest.embed.title'))
                .setDescription(getLocaleTranslation('en-US', 'commands.dev.localetest.embed.description'))
                .addFields(
                    {
                        name: getLocaleTranslation('en-US', 'commands.dev.localetest.embed.missing'),
                        value: getLocaleTranslation('en-US', 'commands.dev.localetest.embed.missingvaluehere')
                    }
                ),

                new discord.EmbedBuilder()
                .setTitle(getLocaleTranslation('ja', 'commands.dev.localetest.embed.title'))
                .setDescription(getLocaleTranslation('ja', 'commands.dev.localetest.embed.description'))
                .addFields(
                    {
                        name: getLocaleTranslation('ja', 'commands.dev.localetest.embed.missing'),
                        value: getLocaleTranslation('ja', 'commands.dev.localetest.embed.missingvaluehere')
                    }
                )
            ]
        })
    }
}