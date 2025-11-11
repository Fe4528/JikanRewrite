const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('publictest')
    .setDescription('public test'),
    async run(discord, client, interaction) {
        const res = await interaction.database.getUser(interaction.user.id);
        interaction.reply(`\`\`\`\nUser Info:\n\nUsername: ${res.user_name}\nUser ID: ${res.user_id}\nVC Time: ${res.vc_time}\nIs Hidden: ${res.is_hidden}\n\`\`\``);
    }
}