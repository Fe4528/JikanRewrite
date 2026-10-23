const { TextInputBuilder, ModalBuilder, LabelBuilder, TextInputStyle, PermissionsBitField, ChannelSelectMenuBuilder, ChannelType, RoleSelectMenuBuilder } = require('discord.js')
const { getLocaleTranslation } = require('#jikan/utils.js');
const JikanCache = require("#jikan/jikan_cache.js")

module.exports = {
    custom_id: "JIKAN_BTN_IGNORED_ROLE_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        const modal = new ModalBuilder()
        .setCustomId("JIKAN_MODAL_IGNORED_ROLE_CONFIG")
        .setTitle(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_BTN_IGNORED_ROLE_CONFIG.title'));
        
        const role_selector = new RoleSelectMenuBuilder()
        .setCustomId("JIKAN_MODAL_ROLE_SELECTOR")
        .setPlaceholder(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_BTN_IGNORED_ROLE_CONFIG.input_placeholder'))
        .setMaxValues(1)
        .setRequired(false);

        const label = new LabelBuilder()
        .setLabel(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_BTN_IGNORED_ROLE_CONFIG.label_info'))
        .setDescription(getLocaleTranslation(interaction.jikan_server_locale, 'common.leave_blank_reset'))
        .setRoleSelectMenuComponent(role_selector);

        modal.addLabelComponents(label);

        await interaction.showModal(modal);
    }
}