const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLocaleTranslation, localizationTemplate, ms_convert, code_block } = require('#jikan/utils.js');
const JikanTempTime = require('#jikan/jikan_temptime.js');
const JikanCache = require('#jikan/jikan_cache.js')
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.public.stats.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.public.stats.description'))
    .addUserOption(
        u => u
        .setName('user')
        .setDescription(getLocaleTranslation('en-US', 'commands.public.stats.options.user.description'))
        .setDescriptionLocalizations(localizationTemplate('commands.public.stats.options.user.description'))
    ),
    async run(client, interaction) {
        try {
            await interaction.deferReply();

            const target_user = interaction.options.getUser('user') || interaction.user

            const user_data = await JikanMySQLDatabase.getAllUserTime(target_user.id, interaction.guildId);
            const user_temp_time = JikanTempTime.getServer(interaction.guildId).get(target_user.id);

            const embed = new EmbedBuilder()
            .setTitle(getLocaleTranslation(interaction.jikan_server_locale, "commands.public.stats.embed.title", target_user.username))
            .setThumbnail(target_user.avatarURL())
            .addFields(
                {
                    name: getLocaleTranslation(interaction.jikan_server_locale, "common.global"),
                    value: code_block(ms_convert(user_data?.global_time || 0, interaction.jikan_server_locale)),
                },
                {
                    name: getLocaleTranslation(interaction.jikan_server_locale, "commands.public.stats.embed.local_this_guild"),
                    value: code_block(ms_convert(user_data?.local_time || 0, interaction.jikan_server_locale)),
                },
                {
                    name: getLocaleTranslation(interaction.jikan_server_locale, "commands.public.stats.embed.realtime_this_guild"),
                    value: code_block(user_temp_time ? ms_convert(Date.now() - user_temp_time.vc_time, interaction.jikan_server_locale) : getLocaleTranslation(interaction.jikan_server_locale, "commands.public.stats.embed.not_in_vc")),
                }
            )

            interaction.editReply({
                embeds: [embed]
            })
        } catch(e) {
            interaction.editReply(`${getLocaleTranslation(interaction.jikan_server_locale, 'system.command_error')}\n${code_block(e.message)}`);
        }
    }
}