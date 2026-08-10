const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanCache = require('#jikan/jikan_cache.js')
const { code_block } = require('#jikan/utils.js')
const { PermissionsBitField, escapeMarkdown, Guild } = require('discord.js');

module.exports = {
    custom_id: "JIKAN_MODAL_LB_NAME_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        try {
            await interaction.deferReply();

            const new_lb_name = escapeMarkdown(interaction.fields.getTextInputValue('JIKAN_MODAL_LB_NAME_TEXT_INPUT'));

            JikanCache.addOrSetServerLBNameCache(interaction.guildId, new_lb_name);
            
            const str = `interaction.customId: ${interaction.customId}\nnew_lb_name: ${new_lb_name}`;

            interaction.editReply(code_block(str));
        } catch(e) {
            interaction.editReply(`${getLocaleTranslation(interaction.jikan_server_locale, 'system.command_error')}\n${code_block(e.message)}`);
        }
    }
}