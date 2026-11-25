const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, PermissionsBitField, InteractionContextType } = require('discord.js');
const { getLocaleTranslation, localizationTemplate, code_block, buildConfigDashboard } = require('#jikan/utils.js');
const JikanCache = require('#jikan/jikan_cache.js');
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.public.config.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.public.config.description'))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild)
    .setContexts(InteractionContextType.Guild),
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        await interaction.deferReply({
            flags: [MessageFlags.Ephemeral]
        });

        const dashboard = buildConfigDashboard(interaction);

        await interaction.editReply({
            embeds: [dashboard.embed],
            components: [dashboard.row1, dashboard.row2],
        })
    }
}