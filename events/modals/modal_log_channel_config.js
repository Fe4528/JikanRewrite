const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanCache = require('#jikan/jikan_cache.js');
const { getLocaleTranslation, buildConfigDashboard } = require('#jikan/utils.js');
const { PermissionsBitField, MessageFlags, channelMention } = require('discord.js');

module.exports = {
    custom_id: "JIKAN_MODAL_LOG_CHANNEL_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        await interaction.deferUpdate();

        const selectedChannels = interaction.fields.getSelectedChannels("JIKAN_MODAL_CHANNEL_SELECTOR");
        const selectedChannel = selectedChannels?.first() ?? null;
        const channelId = selectedChannel?.id ?? null;

        if (channelId) {
            JikanCache.addOrSetLogChannelCache(interaction.guildId, channelId);
            await JikanMySQLDatabase.setGuildSetting(interaction.guildId, "log_channel", channelId);
        } else {
            if (!JikanCache.getServerLogChannelCache(interaction.guildId)) {
                await interaction.followUp({
                    content: getLocaleTranslation(interaction.jikan_server_locale, 'common.config_cache_miss'),
                    flags: [MessageFlags.Ephemeral]
                });
                return;
            }

            JikanCache.removeServerLogChannelCache(interaction.guildId);
            await JikanMySQLDatabase.setGuildSetting(interaction.guildId, "log_channel", null);
        }

        const dashboard = buildConfigDashboard(interaction);

        await interaction.editReply({
            embeds: [dashboard.embed],
            components: [dashboard.row1, dashboard.row2]
        });

        const responseText = channelId
            ? getLocaleTranslation(interaction.jikan_server_locale, `modals.config.${this.custom_id}.responses.success`, channelMention(channelId))
            : getLocaleTranslation(interaction.jikan_server_locale, 'common.config_reset');

        await interaction.followUp({
            content: responseText,
            flags: [MessageFlags.Ephemeral]
        });
    }
};