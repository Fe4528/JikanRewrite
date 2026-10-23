const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanCache = require('#jikan/jikan_cache.js')
const { code_block, getLocaleTranslation } = require('#jikan/utils.js')
const { PermissionsBitField, escapeMarkdown, Guild, ChannelType, channelMention } = require('discord.js');

module.exports = {
    custom_id: "JIKAN_MODAL_IGNORED_ROLE_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        try {
            await interaction.deferReply();
            interaction.editReply('test');
        } catch(e) {
            interaction.editReply(`${getLocaleTranslation(interaction.jikan_server_locale, 'system.command_error')}\n${code_block(e.message)}`);
        }
    }
}