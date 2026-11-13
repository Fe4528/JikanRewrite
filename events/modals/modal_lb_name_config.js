const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanCache = require('#jikan/jikan_cache.js');
const { getLocaleTranslation, buildConfigDashboard } = require('#jikan/utils.js');
const { PermissionsBitField, escapeMarkdown, MessageFlags } = require('discord.js');

module.exports = {
    custom_id: "JIKAN_MODAL_LB_NAME_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        await interaction.deferUpdate();

        const new_lb_name = escapeMarkdown(interaction.fields.getTextInputValue('JIKAN_MODAL_LB_NAME_TEXT_INPUT').trim());

        JikanCache.addOrSetServerLBNameCache(interaction.guildId, new_lb_name);
        await JikanMySQLDatabase.setGuildSetting(interaction.guildId, "leaderboard_name", new_lb_name.length > 0 ? new_lb_name : null);
        
        const dashboard = buildConfigDashboard(interaction);

        await interaction.editReply({
            embeds: [dashboard.embed],
            components: [dashboard.row1, dashboard.row2]
        });

        const responseText = new_lb_name.length > 0
            ? getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_LB_NAME_CONFIG.responses.success', new_lb_name)
            : getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_LB_NAME_CONFIG.responses.reset');

        await interaction.followUp({
            content: responseText,
            flags: [MessageFlags.Ephemeral]
        });
    }
}