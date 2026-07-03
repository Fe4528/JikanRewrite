const { SlashCommandBuilder } = require('discord.js');
const { getLocaleTranslation, localizationTemplate, ms_convert, code_block } = require('../../static/utils.js');
const TempTime = require('../../static/temptime.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.public.mystats.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.public.mystats.description')),
    async run(discord, client, interaction) {
        await interaction.deferReply();

        const user_data = await client.database.getAllUserTime(interaction.user.id, interaction.guild.id);
        const user_temp_time = TempTime.getServer(interaction.guild.id).get(interaction.user.id);

        const embed = new discord.EmbedBuilder()
        .setTitle(getLocaleTranslation(interaction.locale, "commands.public.mystats.embed.title", interaction.user.username))
        .setThumbnail(interaction.user.avatarURL())
        .addFields(
            {
                name: getLocaleTranslation(interaction.locale, "common.global"),
                value: code_block(ms_convert(user_data.global_time)),
            },
            {
                name: getLocaleTranslation(interaction.locale, "commands.public.mystats.embed.local_this_guild"),
                value: code_block(ms_convert(user_data.local_time)),
            },
            {
                name: getLocaleTranslation(interaction.locale, "commands.public.mystats.embed.realtime_this_guild"),
                value: code_block(user_temp_time ? ms_convert(Date.now() - user_temp_time.vc_time) : getLocaleTranslation(interaction.locale, "commands.public.mystats.embed.not_in_vc")),
            }
        )

        interaction.editReply({
            embeds: [embed]
        })
    }
}