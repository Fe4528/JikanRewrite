
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanCache = require('#jikan/jikan_cache.js');
const { getLocaleTranslation, buildConfigDashboard } = require('#jikan/utils.js');

const { PermissionsBitField, MessageFlags, WebhookClient, channelMention } = require('discord.js');

module.exports = {
    custom_id: "JIKAN_MODAL_LOG_CHANNEL_CONFIG",
    permissions: [PermissionsBitField.Flags.ManageGuild],

    async run(client, interaction) {
        await interaction.deferUpdate();

        const guild_id = interaction.guildId;

        const selectedChannels = interaction.fields.getSelectedChannels("JIKAN_MODAL_CHANNEL_SELECTOR");

        const selectedChannel = selectedChannels?.first() ?? null;
        const channelId = selectedChannel?.id ?? null;

        const old_channel_id = JikanCache.getServerLogChannelCache(guild_id);
        const old_webhook_url = JikanCache.getServerWebhookURL(guild_id);
        const old_webhook = JikanCache.getServerWebhookObject(guild_id);

        let new_webhook = null;

        try {
            if (channelId) {
                const bot_permissions = selectedChannel.permissionsFor(
                    interaction.guild.members.me
                );

                if (!bot_permissions?.has([
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.ManageWebhooks
                ])) {
                    await interaction.followUp({
                        content: getLocaleTranslation(
                            interaction.jikan_server_locale,
                            'modals.config.JIKAN_MODAL_LOG_CHANNEL_CONFIG.create_webhook_noperms'
                        ),
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                if (channelId === old_channel_id && old_webhook_url) {
                    const dashboard = buildConfigDashboard(interaction);

                    await interaction.editReply({
                        embeds: [dashboard.embed],
                        components: [dashboard.row1, dashboard.row2]
                    });

                    await interaction.followUp({
                        content: getLocaleTranslation(
                            interaction.jikan_server_locale,
                            `modals.config.${this.custom_id}.responses.success`,
                            channelMention(channelId)
                        ),
                        flags: MessageFlags.Ephemeral
                    });

                    return;
                }

                new_webhook = await selectedChannel.createWebhook({
                    name: "Jikan",
                    avatar: "https://ironworks.neocities.org/assets/jikan.png",
                    reason: getLocaleTranslation(
                        interaction.jikan_server_locale,
                        'webhook.create_reason'
                    )
                });

                await JikanMySQLDatabase.setGuildSetting(guild_id, {
                    log_channel: channelId,
                    webhook_url: new_webhook.url
                });

                JikanCache.setGuildSettings(guild_id, {
                    log_channel: channelId,
                    webhook_url: new_webhook.url
                });

                if (old_webhook_url) {
                    try {
                        const webhook_client = old_webhook ??
                            new WebhookClient({ url: old_webhook_url });

                        await webhook_client.delete();
                    } catch (e) {
                        console.error('Failed to delete previous VC webhook:', e);
                    }
                }
            } else {
                if (!old_channel_id) {
                    await interaction.followUp({
                        content: getLocaleTranslation(
                            interaction.jikan_server_locale,
                            'common.config_cache_miss'
                        ),
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                await JikanMySQLDatabase.setGuildSetting(guild_id, {
                    log_channel: null,
                    webhook_url: null
                });

                JikanCache.setGuildSettings(guild_id, {
                    log_channel: null,
                    webhook_url: null
                });

                if (old_webhook_url) {
                    try {
                        const webhook_client = old_webhook ??
                            new WebhookClient({ url: old_webhook_url });

                        await webhook_client.delete();
                    } catch (e) {
                        console.error('Failed to delete VC webhook:', e);
                    }
                }
            }
        } catch (e) {
            console.error('VC log configuration error:', e);
            if (new_webhook) {
                try {
                    await new_webhook.delete();
                } catch (delete_error) {
                    console.error('Failed to clean up new VC webhook:', delete_error);
                }
            }

            await interaction.followUp({
                content: getLocaleTranslation(interaction.jikan_server_locale, 'system.config_error'),
                flags: MessageFlags.Ephemeral
            });

            return;
        }

        const dashboard = buildConfigDashboard(interaction);

        await interaction.editReply({
            embeds: [dashboard.embed],
            components: [dashboard.row1, dashboard.row2]
        });

        const responseText = channelId ? 
        getLocaleTranslation(interaction.jikan_server_locale, `modals.config.${this.custom_id}.responses.success`, channelMention(channelId)) :
        getLocaleTranslation(interaction.jikan_server_locale, 'common.config_reset');

        await interaction.followUp({
            content: responseText,
            flags: MessageFlags.Ephemeral
        });
    }
};
