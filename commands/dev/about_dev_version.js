const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const node_os = require('node-os-utils');
const { getLocaleTranslation, code_block } = require('../../static/utils.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('about_dev_version')
    .setDescription('about Jikan')
    .setDescriptionLocalizations({
        "ja": getLocaleTranslation("ja", "commands.public.about.description")
    }),
    async run(discord, client, interaction) {
        let cpus = node_os.cpu;
        let os_name = await node_os.os.type();
        let cpu_usage = await node_os.cpu.usage();

        interaction.reply({
            embeds: [
                new EmbedBuilder()
                .setColor("ffffff")
                .setTitle("Jikan")
                .setDescription(`${getLocaleTranslation(interaction.locale, 'commands.public.about.embed.description.creator', '@fe4528')}\n\n${getLocaleTranslation(interaction.locale, 'commands.public.about.embed.description.user_count', 'cannot find')}`)
                .addFields([
                    {
                        name: getLocaleTranslation(interaction.locale, 'commands.public.about.embed.fields.server_count.name'),
                        value: `${interaction.client.guilds.cache.size}`,
                        inline: true
                    },
                    {
                        name: getLocaleTranslation(interaction.locale, 'commands.public.about.embed.fields.ping.name'),
                        value: `${interaction.client.ws.ping}ms`,
                        inline: true
                    }
                ])
                .addFields([
                    {
                        name: getLocaleTranslation(interaction.locale, 'commands.public.about.embed.fields.hardware.name'),
                        value: code_block(getLocaleTranslation(interaction.locale, 'commands.public.about.embed.fields.hardware.value',
                            cpus.model(),
                            `${cpu_usage}`,
                            os_name
                        )),
                    }
                ])
            ]
        });
    }
}