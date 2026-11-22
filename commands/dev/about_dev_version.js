const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle} = require('discord.js');
const sysinfo = require('systeminformation');
const { getLocaleTranslation, code_block, localizationTemplate } = require('#jikan/utils.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription('about Jikan')
    .setDescriptionLocalizations(localizationTemplate('commands.public.about.description')),
    async run(client, interaction) {
        await interaction.deferReply()

        const cpu_info = await sysinfo.cpu();
        const cpu_usage = await sysinfo.currentLoad();
        const os_info = await sysinfo.osInfo();
        const os_name = `${os_info.distro} ${os_info.release}`;

        const locale = interaction.jikan_server_locale

        const buttons = new ActionRowBuilder()
        .addComponents([
            new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Invite")
            .setURL("https://discord.com/api/oauth2/authorize?client_id=1127552783848058890&permissions=537133056&scope=bot%20applications.commands"),
            
            new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Website")
            .setURL("https://ironworks.neocities.org/apps/Jikan"),

            new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("GitHub")
            .setURL("https://github.com/Fe4528/JikanRewrite")
        ])

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                .setColor("ffffff")
                .setTitle("Jikan")
                .setDescription(`${getLocaleTranslation(locale, 'commands.public.about.embed.description.creator', '@fe4528')}\n\n${getLocaleTranslation(interaction.locale, 'commands.public.about.embed.description.user_count', 'cannot find')}`)
                .addFields([
                    {
                        name: getLocaleTranslation(locale, 'commands.public.about.embed.fields.server_count.name'),
                        value: `${interaction.client.guilds.cache.size}`,
                        inline: true
                    },
                    {
                        name: getLocaleTranslation(locale, 'commands.public.about.embed.fields.ping.name'),
                        value: `${interaction.client.ws.ping}ms`,
                        inline: true
                    }
                ])
                .addFields([
                    {
                        name: getLocaleTranslation(locale, 'commands.public.about.embed.fields.hardware.name'),
                        value: code_block(
                            `${getLocaleTranslation(locale, 'commands.public.about.embed.fields.hardware.cpu_model', `${cpu_info.manufacturer} ${cpu_info.brand}`)}\n` +
                            `${getLocaleTranslation(locale, 'commands.public.about.embed.fields.hardware.cpu_usage_value', cpu_usage.currentLoad.toFixed(2))}%\n` +
                            `${getLocaleTranslation(locale, 'commands.public.about.embed.fields.hardware.os_value', os_name)}`
                        )
                    }
                ])
            ],
            components: [buttons]
        });
    }
}