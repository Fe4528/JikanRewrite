const { SlashCommandBuilder } = require('discord.js')
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription('local and temp test result'),
    async run(discord, client, interaction) {
        let r = await client.database.getTempTimeAndLocal(interaction.user.id, interaction.guild.id);
        console.log(r);
        interaction.reply("Check console");
    }
}