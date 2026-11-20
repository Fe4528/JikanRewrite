const { ModalBuilder, LabelBuilder, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');
const { getLocaleTranslation } = require('#jikan/utils.js');

module.exports = {
    custom_id: "JIKAN_BTN_LOCALE_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        const modal = new ModalBuilder()
            .setCustomId("JIKAN_MODAL_LOCALE_CONFIG")
            .setTitle(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_LOCALE_CONFIG.title'));

        const lang_selector = new StringSelectMenuBuilder()
            .setCustomId("JIKAN_MODAL_LOCALE_SELECTOR")
            .setPlaceholder(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_LOCALE_CONFIG.input_placeholder'))
            .setMinValues(1)
            .setMaxValues(1)
            .setRequired(false)
            .addOptions(
                { label: "English", value: "en-US" },
                { label: "日本語", value: "ja" }
            );

        const label = new LabelBuilder()
            .setLabel(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_LOCALE_CONFIG.label_info'))
            .setDescription(getLocaleTranslation(interaction.jikan_server_locale, 'common.leave_blank_reset'))
            .setStringSelectMenuComponent(lang_selector);

        modal.addLabelComponents(label);

        await interaction.showModal(modal);
    }
};