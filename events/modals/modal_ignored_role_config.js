const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanCache = require('#jikan/jikan_cache.js');
const { getLocaleTranslation, buildConfigDashboard } = require('#jikan/utils.js');
const { PermissionsBitField, MessageFlags, roleMention } = require('discord.js');

module.exports = {
    custom_id: "JIKAN_MODAL_IGNORED_ROLE_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        await interaction.deferUpdate();

        const selected_roles = interaction.fields.getSelectedRoles("JIKAN_MODAL_ROLE_SELECTOR");
        const selected_role = selected_roles?.first() ?? null;
        const role_id = selected_role?.id ?? null;

        try {
            if (role_id) {
                await JikanMySQLDatabase.setGuildSetting(interaction.guildId, "ignored_role", role_id);
                JikanCache.addOrSetServerIgnoredRoleCache(interaction.guildId, role_id);
            } else {
                if (!JikanCache.getServerIgnoredRoleCache(interaction.guildId)) {
                    await interaction.followUp({
                        content: getLocaleTranslation(interaction.jikan_server_locale, 'common.config_cache_miss'),
                        flags: [MessageFlags.Ephemeral]
                    });
                    return;
                }

                await JikanMySQLDatabase.setGuildSetting(interaction.guildId, "ignored_role", null);
                JikanCache.removeServerIgnoredRoleCache(interaction.guildId);
            }
        } catch (error) {
            await interaction.followUp({
                content: getLocaleTranslation(interaction.jikan_server_locale, 'system.database_error'),
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const dashboard = buildConfigDashboard(interaction);

        await interaction.editReply({
            embeds: [dashboard.embed],
            components: [dashboard.row1, dashboard.row2]
        });

        const response_text = role_id
            ? getLocaleTranslation(interaction.jikan_server_locale, `modals.config.${this.custom_id}.responses.success`, roleMention(role_id))
            : getLocaleTranslation(interaction.jikan_server_locale, 'common.config_reset');

        await interaction.followUp({
            content: response_text,
            flags: [MessageFlags.Ephemeral]
        });
    }
};