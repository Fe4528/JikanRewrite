const { SlashCommandBuilder } = require('discord.js');
const { getLocaleTranslation } = require('../../static/utils.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('localetest')
    .setDescription(getLocaleTranslation('en-US', 'commands.dev.localetest.description'))
    .setDescriptionLocalizations({
        "ja": getLocaleTranslation("ja", "commands.dev.localetest.description")
    }),
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