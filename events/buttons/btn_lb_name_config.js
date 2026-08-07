const { TextInputBuilder, ModalBuilder, LabelBuilder, TextInputStyle, PermissionsBitField } = require('discord.js')
const { getLocaleTranslation } = require('#jikan/utils.js');
const JikanCache = require("#jikan/jikan_cache.js")

module.exports = {
    custom_id: "JIKAN_BTN_LB_NAME_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        const server_locale = JikanCache.getServerLangCache(interaction.guildId)

        const modal = new ModalBuilder()
        .setCustomId('JIKAN_MODAL_LOG_CHANNEL_CONFIG')
        .setTitle(getLocaleTranslation(server_locale, 'modals.config.JIKAN_MODAL_LB_NAME_CONFIG.title'));
        
        const lb_name_input = new TextInputBuilder()
        .setCustomId("JIKAN_MODAL_LB_NAME_TEXT_INPUT")
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(getLocaleTranslation(server_locale, 'modals.config.JIKAN_MODAL_LB_NAME_CONFIG.input_placeholder'))
        .setMaxLength(40)
        .setMinLength(0)
        .setRequired(false);

        const label = new LabelBuilder()
        .setLabel(getLocaleTranslation(server_locale, 'modals.config.JIKAN_MODAL_LB_NAME_CONFIG.label_info'))
        .setDescription(getLocaleTranslation(server_locale, 'common.leave_blank_reset'))
        .setTextInputComponent(lb_name_input);

        modal.addLabelComponents(label);

        await interaction.showModal(modal);
    }
}