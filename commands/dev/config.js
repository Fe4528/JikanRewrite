const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags, PermissionsBitField } = require('discord.js');
const { getLocaleTranslation, localizationTemplate, code_block } = require('#jikan/utils.js');
const JikanCache = require('#jikan/jikan_cache.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.public.config.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.public.config.description')),
    permissions: [PermissionsBitField.Flags.ManageGuild],
    async run(client, interaction) {
        try {            
            const embed = new EmbedBuilder()
            .setTitle(getLocaleTranslation(interaction.jikan_server_locale, 'commands.public.config.embeds.main.title'))
            .setDescription(getLocaleTranslation(interaction.jikan_server_locale, 'commands.public.config.embeds.main.description'));

            const lb_name_config = new ButtonBuilder()
            .setCustomId("JIKAN_BTN_LB_NAME_CONFIG")
            .setStyle(ButtonStyle.Secondary)
            .setLabel(getLocaleTranslation(interaction.jikan_server_locale, 'buttons.config.JIKAN_BTN_LB_NAME_CONFIG'));

            const log_channel_config = new ButtonBuilder()
            .setCustomId("JIKAN_BTN_LOG_CHANNEL_CONFIG")
            .setStyle(ButtonStyle.Secondary)
            .setLabel(getLocaleTranslation(interaction.jikan_server_locale, 'buttons.config.JIKAN_BTN_LOG_CHANNEL_CONFIG'));

            const ignored_role_config = new ButtonBuilder()
            .setCustomId('JIKAN_BTN_IGNORED_ROLE_CONFIG')
            .setStyle(ButtonStyle.Secondary)
            .setLabel(getLocaleTranslation(interaction.jikan_server_locale, 'buttons.config.JIKAN_BTN_IGNORED_ROLE_CONFIG'))

            const button_row = new ActionRowBuilder().addComponents(lb_name_config, log_channel_config, ignored_role_config);

            interaction.reply({
                embeds: [embed],
                components: [button_row],
                //flags: [MessageFlags.Ephemeral]
            })
        } catch (e) {
            interaction.reply(`${getLocaleTranslation(interaction.jikan_server_locale, 'system.command_error')}\n${code_block(e.message)}`);
        }
    }
}