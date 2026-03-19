const { SlashCommandBuilder } = require('discord.js');
const { ms_convert, getLocaleTranslation } = require('../../static/utils');


module.exports = {
    data: new SlashCommandBuilder()
    .setName('getalltime')
    .setDescription(getLocaleTranslation('en-US', 'commands.public.mystats.description')),
    async run(discord, client, interaction) {
        const time = await client.database.getAllUserTime(interaction.user.id, interaction.guild.id);
        const time_now = Date.now();
        const locale = interaction.locale;

        const time_embed = new discord.EmbedBuilder()
            .setTitle(getLocaleTranslation(locale, 'commands.public.mystats.embed.title', interaction.user.username))
        .addFields(
            {
                name: getLocaleTranslation(locale, 'commands.public.mystats.embed.global_field_name'),
                value: ms_convert(time.global_time)
            },
            {
                name: interaction.guild.name,
                value: ms_convert(time.local_time)
            },
            {
                name: getLocaleTranslation(locale, 'commands.public.mystats.embed.realtime_field_name'),
                value: !time?.temp_time ? getLocaleTranslation(locale, 'commands.public.mystats.embed.not_in_vc') : ms_convert(time_now - time.temp_time)
            }
        )

        interaction.reply({
            embeds: [time_embed]
        })
    }
}