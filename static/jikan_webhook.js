const { WebhookClient, EmbedBuilder, userMention } = require('discord.js');
const { getLocaleTranslation } = require('#jikan/utils.js');
const JikanCache = require('#jikan/jikan_cache.js');

const embedColors = {
    join: '#57F287',
    move: '#FEE75C',
    leave: '#ED4245'
};

function getVCStateType(state, locale) {
    switch(state) {
        case 'join':
            return getLocaleTranslation(locale, 'webhook.actions.join');
        case 'move':
            return getLocaleTranslation(locale, 'webhook.actions.move');
        case 'leave':
            return getLocaleTranslation(locale, 'webhook.actions.leave');
        default:
            return null;
    }
}

class JikanWebhookManager {
    /**
     * Send a VC webhook log, will work if the server configured one.
     * @param {'join'|'move'|'leave'} type
     */
    static async sendVCLog(type, member, locale, old_channel = null, new_channel = null) {
        try {
            const guild_id = member.guild.id;

            if (!embedColors[type]) {
                console.log(`Invalid VC log type: ${type}`);
                return;
            }

            let webhook = JikanCache.getServerWebhookObject(guild_id);

            if (!webhook) {
                const webhook_url = JikanCache.getServerWebhookURL(guild_id);
                //console.log(webhook_url)
                if (!webhook_url) return;

                webhook = new WebhookClient({
                    url: webhook_url
                });

                JikanCache.addOrSetServerWebhookObject(guild_id, webhook);
            }

            const channelString = getLocaleTranslation(locale, 'common.channel');

            const embed = new EmbedBuilder()
                .setTitle(getLocaleTranslation(
                    locale,
                    'webhook.title',
                    getVCStateType(type, locale)
                ))
                .setColor(embedColors[type])
                .setDescription(`${getLocaleTranslation(locale, 'common.user')} ${userMention(member.id)}`)
                .setFooter({
                    text: `${getLocaleTranslation(locale, 'common.user_id')}: ${member.id}`
                })
                .setTimestamp();

            if (type === 'join') {
                if (!new_channel) return;

                embed.addFields({
                    name: channelString,
                    value: new_channel.name
                });
            } else if (type === 'move') {
                if (!old_channel || !new_channel) return;

                embed.addFields(
                    {
                        name: getLocaleTranslation(locale, 'webhook.embed.channel.from'),
                        value: old_channel.name,
                        inline: true
                    },
                    {
                        name: getLocaleTranslation(locale, 'webhook.embed.channel.to'),
                        value: new_channel.name,
                        inline: true
                    }
                );
            } else if (type === 'leave') {
                if (!old_channel) return;

                embed.addFields({
                    name: channelString,
                    value: old_channel.name
                });
            }

            await webhook.send({
                embeds: [embed]
            });

        } catch(e) {
            console.error('VC webhook error:', e);
        }
    }
}

module.exports = JikanWebhookManager;
