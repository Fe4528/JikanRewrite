const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('getuser')
    .setDescription('get user by id')
    .addStringOption(i => i
        .setName('user_id')
        .setDescription('user id')
        .setRequired(true)
    ),
    async run(discord, client, interaction) {
        const res = await client.database.getUser(interaction.options.getString("user_id").trim());

        if (!res) {
            return interaction.reply("Not found");
        }

        interaction.reply(`\`\`\`\nUser Info:\n\nUsername: ${res.user_name}\nUser ID: ${res.user_id}\nVC Time: ${res.vc_time}\nIs Hidden: ${res.is_hidden}\n\`\`\``);
    }
}