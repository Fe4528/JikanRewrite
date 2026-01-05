const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const node_os = require('node-os-utils');
const { getLocaleTranslation } = require('../../utils');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('about Jikan')
    .setDescriptionLocalizations({
        "en-US": getLocaleTranslation("en-US", "commands.public.about.description"),
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
                .addFields([
                    {
                        name: "Hardware",
                        value: `\`\`\`\nCPU: x${cpus.count()} ${cpus.model()}\nCPU Usage: ${cpu_usage}%\nOS: ${os_name}\n\`\`\``
                    }
                ])
            ]
        });
    }
}