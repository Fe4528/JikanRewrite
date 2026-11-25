const { SlashCommandBuilder, ModalBuilder, LabelBuilder, TextDisplayBuilder, MessageFlags } = require('discord.js');
const { getLocaleTranslation, localizationTemplate } = require('#jikan/utils.js');
const path = require('path');
const JikanMySQLDatabase = require("#jikan/jikan_mysql_manager.js");

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.public.hideme.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.public.hideme.description')),
    async run(client, interaction) {
        
        // await interaction.reply({
        //     content: getLocaleTranslation(interaction.jikan_server_locale, 'common.please_wait'),
        //     flags: [MessageFlags.Ephemeral]
        // });

        const userHiddenStatus = await JikanMySQLDatabase.checkIfUserIsHidden(interaction.user.id)

        const modal = new ModalBuilder()
        .setCustomId("JIKAN_MODAL_USER_LB_HIDE")
        .setTitle(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_USER_LB_HIDE.title'))
        
        const label = new LabelBuilder()
        .setLabel(getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_USER_LB_HIDE.label_info'))
        .setRadioGroupComponent((radioGroup) =>
			radioGroup.setCustomId('hide_RADIOGRP')
            .addOptions([
				{ 
                    label: getLocaleTranslation(interaction.jikan_server_locale, 'common.no'),
                    value: 'hide_NO', 
                    default: !userHiddenStatus
                },
				{ 
                    label: getLocaleTranslation(interaction.jikan_server_locale, 'common.yes'), 
                    value: 'hide_YES',
                    default: userHiddenStatus
                },
			])
            .setRequired(true)
		)

        const statusString = userHiddenStatus ? 
        `${getLocaleTranslation(interaction.jikan_server_locale, 'common.status')}: ${getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_USER_LB_HIDE.user_status.hidden')}` :
        `${getLocaleTranslation(interaction.jikan_server_locale, 'common.status')}: ${getLocaleTranslation(interaction.jikan_server_locale, 'modals.config.JIKAN_MODAL_USER_LB_HIDE.user_status.not_hidden')}`

        const statusLabel = new TextDisplayBuilder()
        .setContent(statusString);

        modal.addLabelComponents(label);
        modal.addTextDisplayComponents(statusLabel);

        await interaction.showModal(modal);
    }
}