const { TextInputBuilder, ModalBuilder, LabelBuilder, TextInputStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType } = require('discord.js')
const { getLocaleTranslation } = require('#jikan/utils.js');
const JikanCache = require("#jikan/jikan_cache.js")

module.exports = {
    custom_id: "JIKAN_BTN_LOG_CHANNEL_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        const modal = new ModalBuilder()
        .setCustomId("JIKAN_MODAL_LOG_CHANNEL_CONFIG")
        .setTitle(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_LOG_CHANNEL_CONFIG.title'));
        
        const log_channel_selector = new ChannelSelectMenuBuilder()
        .setCustomId("JIKAN_MODAL_CHANNEL_SELECTOR")
        .setPlaceholder(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_LOG_CHANNEL_CONFIG.input_placeholder'))
        .addChannelTypes(ChannelType.GuildText)
        .setMaxValues(1)
        .setRequired(false);

        const label = new LabelBuilder()
        .setLabel(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_LOG_CHANNEL_CONFIG.label_info'))
        .setDescription(getLocaleTranslation(interaction.jikan_server_locale, 'common.leave_blank_reset'))
        .setChannelSelectMenuComponent(log_channel_selector);

        modal.addLabelComponents(label);

        await interaction.showModal(modal);
    }
}