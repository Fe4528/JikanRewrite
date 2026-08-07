const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanCache = require('#jikan/jikan_cache.js')
const { code_block, getLocaleTranslation } = require('#jikan/utils.js')
const { PermissionsBitField, escapeMarkdown, Guild, ChannelType, channelMention } = require('discord.js');

module.exports = {
    custom_id: "JIKAN_MODAL_LOG_CHANNEL_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        const server_locale = JikanCache.getServerLangCache(interaction.guildId);

        try {
            await interaction.deferReply();

            let new_log_channel = interaction.fields.getSelectedChannels("JIKAN_MODAL_CHANNEL_SELECTOR");

            if (new_log_channel) {
                new_log_channel = new_log_channel.first();
                const channel_id = new_log_channel.id

                JikanCache.addOrSetLogChannelCache(interaction.guildId, channel_id);
                interaction.editReply(getLocaleTranslation(server_locale, 'modals.config.JIKAN_MODAL_LOG_CHANNEL_CONFIG.responses.success', channelMention(channel_id)));
            } else {
                if (!JikanCache.getServerLogChannelCache(interaction.guildId)) {
                    interaction.editReply(getLocaleTranslation(server_locale, 'common.config_cache_miss'));
                    return;
                }

                JikanCache.removeServerLogChannelCache(interaction.guildId);
                interaction.editReply(getLocaleTranslation(server_locale, 'common.config_reset'));
            }
        } catch(e) {
            interaction.editReply(`${getLocaleTranslation(server_locale, 'system.command_error')}\n${code_block(e.message)}`);
        }
    }
}