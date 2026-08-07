const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { getLocaleTranslation, localizationTemplate, code_block, ms_convert } = require('#jikan/utils.js');
const JikanCache = require('#jikan/jikan_cache.js');
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.public.comparewith.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.public.compare.description'))
    .addUserOption(
        u => u
        .setName('user')
        .setDescription(getLocaleTranslation('en-US', 'commands.public.comparewith.options.user.description'))
        .setDescriptionLocalizations(localizationTemplate('commands.public.comparewith.options.user.description'))
        .setRequired(true)
    )
    .addStringOption(
        opt => opt
        .setName('scope')
        .setDescription(getLocaleTranslation('en-US', 'commands.public.comparewith.options.scope.description'))
        .setDescriptionLocalizations(localizationTemplate('commands.public.comparewith.options.scope.description'))
        .addChoices(
            {
                name: getLocaleTranslation('en-US', 'common.local'),
                name_localizations: localizationTemplate('common.local'),
                value: 'local'
            },
            {
                name: getLocaleTranslation('en-US', 'common.global'),
                name_localizations: localizationTemplate('common.global'),
                value: 'global'
            }
        )
    ),
    async run(client, interaction) {
        const server_locale = JikanCache.getServerLangCache(interaction.guildId);

        try {
            const selected_scope = interaction.options.getString("scope") || 'local'
            const selected_user = interaction.options.getUser('user')

            const embed = new EmbedBuilder()

            if (interaction.user.id == selected_user.id) {
                // comparing with yourself lol
                embed
                .setColor('#ff0000')
                .setTitle(getLocaleTranslation(server_locale, 'commands.public.comparewith.embeds.self_compare.title'))
            } else if (selected_user.bot) {
                embed
                .setColor('#ffffff')
                .setTitle(getLocaleTranslation(server_locale, 'commands.public.comparewith.embeds.bot_response.title'))
                .setImage('https://cdn.discordapp.com/attachments/967064220514549760/1533346372936536074/E2wouPdd8fljnl.gif?ex=6a702797&is=6a6ed617&hm=14a0c6ca3383b34ef1f5641dbf684ac3d098cf7039d3a2d01fd729d130b45008&')
            } else {
                // success
                const compare_result = await JikanMySQLDatabase.getBothUserTime({
                    server_id: interaction.guildId,
                    uid_1: interaction.user.id,
                    uid_2: selected_user.id
                }, selected_scope)

                embed
                .setTitle(`${interaction.user.username} vs ${selected_user.username}`)
                .setColor('#ffffff')
                .setDescription(`${getLocaleTranslation(server_locale, 'commands.public.comparewith.embeds.success.description', 
                    `\`${getLocaleTranslation(server_locale, `leaderboard_titles.${selected_scope}`, interaction.guild.name)}\``)}`)
                .addFields(
                    {
                        name: compare_result.user1_time > compare_result.user2_time ? `${interaction.user.username} :crown:` : interaction.user.username,
                        value: code_block(ms_convert(compare_result.user1_time))
                    },
                    {
                        name:  compare_result.user2_time > compare_result.user1_time ? `${selected_user.username} :crown:` : selected_user.username,
                        value: code_block(ms_convert(compare_result.user2_time))
                    }
                )
            }

            interaction.reply({
                embeds: [embed],
            })
        } catch (e) {
            interaction.reply(`${getLocaleTranslation(server_locale, 'system.command_error')}\n${code_block(e.message)}`);
        }
    }
}