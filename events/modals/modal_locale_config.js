const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanCache = require('#jikan/jikan_cache.js');
const { getLocaleTranslation, buildConfigDashboard } = require('#jikan/utils.js');
const { PermissionsBitField, MessageFlags } = require('discord.js');

module.exports = {
    custom_id: "JIKAN_MODAL_LOCALE_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        await interaction.deferUpdate();

        const selected_values = interaction.fields.getStringSelectValues("JIKAN_MODAL_LOCALE_SELECTOR");
        const new_locale = selected_values?.[0]?.trim() || null;

        try {
            if (new_locale) {
                await JikanMySQLDatabase.setGuildSetting(interaction.guildId, "server_locale", new_locale);
                JikanCache.addOrSetServerLangCache(interaction.guildId, new_locale);
            } else {
                if (!JikanCache.getServerLangCache(interaction.guildId)) {
                    await interaction.followUp({
                        content: getLocaleTranslation(interaction.jikan_server_locale, 'common.config_cache_miss'),
                        flags: [MessageFlags.Ephemeral]
                    });
                    return;
                }

                await JikanMySQLDatabase.setGuildSetting(interaction.guildId, "server_locale", "en-US");
                JikanCache.addOrSetServerLangCache(interaction.guildId, "en-US");
            }
        } catch (error) {
            await interaction.followUp({
                content: getLocaleTranslation(interaction.jikan_server_locale, 'common.database_error'),
                flags: [MessageFlags.Ephemeral]
            });
            return;
        }

        const dashboard = buildConfigDashboard(interaction);

        await interaction.editReply({
            embeds: [dashboard.embed],
            components: [dashboard.row1, dashboard.row2]
        });

        const response_text = new_locale
            ? getLocaleTranslation(new_locale, `modals.config.${this.custom_id}.responses.success`, new_locale)
            : getLocaleTranslation(interaction.jikan_server_locale, `modals.config.${this.custom_id}.responses.reset`);

        await interaction.followUp({
            content: response_text,
            flags: [MessageFlags.Ephemeral]
        });
    }
};