const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const { getLocaleTranslation } = require('#jikan/utils.js');
const { MessageFlags } = require('discord.js');

module.exports = {
    custom_id: "JIKAN_MODAL_USER_LB_HIDE",

    async run(client, interaction) {
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        });

        const selected_value = interaction.fields.getField("hide_RADIOGRP").value;
        const is_hidden = selected_value === "hide_YES";

        try {
            await JikanMySQLDatabase.setUserHiddenStatus(
                interaction.user.id,
                interaction.user.username,
                is_hidden
            );
        } catch (error) {
            await interaction.editReply({
                content: getLocaleTranslation(
                    interaction.jikan_server_locale,
                    'system.database_error'
                )
            });
            return;
        }

        const response_text = getLocaleTranslation(
            interaction.jikan_server_locale,
            `modals.config.${this.custom_id}.responses.${is_hidden ? 'success_hide' : 'success_not_hide'}`
        );

        await interaction.editReply({
            content: response_text
        });
    }
};