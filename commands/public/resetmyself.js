const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, InteractionContextType } = require('discord.js');
const { getLocaleTranslation, localizationTemplate } = require('#jikan/utils.js');
const JikanTempTime = require('#jikan/jikan_temptime.js');
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription('Reset your accumulated VC time')
    .setDescriptionLocalizations(localizationTemplate('commands.public.reset.myself.description'))
    .addStringOption(option =>
        option
        .setName('scope')
        .setDescription('Which leaderboard data to reset')
        .addChoices(
            { 
                name: 'Local',
                value: 'local'
            },
            { 
                name: 'Global',
                value: 'global'
            }
        )
        .setRequired(true)
    )
    .setContexts(InteractionContextType.Guild),

    async run(client, interaction) {
        const scope = interaction.options.getString('scope');
        const user_id = interaction.user.id;
        const guild_id = interaction.guildId;

        const confirmation = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
            .setCustomId('reset_confirm')
            .setLabel(getLocaleTranslation(interaction.jikan_server_locale, 'common.confirm'))
            .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
            .setCustomId('reset_cancel')
            .setLabel(getLocaleTranslation(interaction.jikan_server_locale, 'common.cancel'))
            .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({
            content: getLocaleTranslation(interaction.jikan_server_locale, 'commands.public.reset.myself.responses.confirmation', `**${getLocaleTranslation(interaction.jikan_server_locale, `common.${scope}`)}**`),
            components: [confirmation],
            flags: [MessageFlags.Ephemeral]
        });

        let response;

        try {
            const confirmation_message = await interaction.fetchReply();

            response = await confirmation_message.awaitMessageComponent({
                filter: i =>
                    i.user.id === user_id &&
                    ['reset_confirm', 'reset_cancel'].includes(i.customId),
                time: 30000
            });
        } catch {
            return interaction.editReply({
                content: getLocaleTranslation(interaction.jikan_server_locale, 'commands.public.reset.generic_responses.timeout'),
                components: []
            });
        }

        if (response.customId === 'reset_cancel') {
            return response.update({
                content: getLocaleTranslation(interaction.jikan_server_locale, 'commands.public.reset.generic_responses.cancel'),
                components: []
            });
        }

        await response.deferUpdate();

        try {
            if (scope === 'local') {
                await JikanMySQLDatabase.resetUserTime(
                    user_id,
                    'LOCAL',
                    guild_id
                );

                JikanTempTime.removeUserInServerTemp({
                    guild_id,
                    user_id
                });
            } else {
                await JikanMySQLDatabase.resetUserTime(
                    user_id,
                    'GLOBAL'
                );

                JikanTempTime.removeUserEverywhere(user_id);
            }

            await interaction.editReply({
                content: getLocaleTranslation(interaction.jikan_server_locale, 'commands.public.reset.myself.responses.success', `**${getLocaleTranslation(interaction.jikan_server_locale, `common.${scope}`)}**`),
                components: []
            });

        } catch (e) {
            console.error(e);

            await interaction.editReply({
                content: getLocaleTranslation(interaction.jikan_server_locale, 'commands.public.reset.myself.responses.error'),
                components: []
            });
        }
    }
};
