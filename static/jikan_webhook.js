const { WebhookClient, EmbedBuilder, userMention, channelMention } = require('discord.js');
const { getLocaleTranslation, ms_convert } = require('#jikan/utils.js');
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
    static async sendVCLog(type, member, locale, user_time = null, old_channel = null, new_channel = null) {
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
                .setTitle(getLocaleTranslation(locale, 'webhook.title', getVCStateType(type, locale)))
                .setColor(embedColors[type])
                .setDescription(`${getLocaleTranslation(locale, 'common.user')}: ${userMention(member.id)}\n${member.user.username}`)
                .setFooter({
                    text: `${getLocaleTranslation(locale, 'common.user_id')}: ${member.id}`
                })
                .setTimestamp();

            if (type === 'join') {
                if (!new_channel) return;

                embed.addFields(
                    {
                        name: channelString,
                        value: channelMention(new_channel.id)
                    }
                );
            } else if (type === 'move') {
                if (!old_channel || !new_channel) return;

                embed.addFields(
                    {
                        name: getLocaleTranslation(locale, 'webhook.embed.channel.from'),
                        value: channelMention(old_channel.id),
                        inline: true
                    },
                    {
                        name: getLocaleTranslation(locale, 'webhook.embed.channel.to'),
                        value: channelMention(new_channel.id),
                        inline: true
                    }
                );
            } else if (type === 'leave') {
                if (!old_channel) return;

                embed.addFields(
                    {
                        name: channelString,
                        value: channelMention(old_channel.id)
                    },
                    {
                        name: getLocaleTranslation(locale, 'common.vc_time'),
                        value: ms_convert(user_time)
                    }
                )
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
