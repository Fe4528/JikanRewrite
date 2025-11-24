const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const node_os = require('node-os-utils');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('about')
    .setDescription('Bot Information'),
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