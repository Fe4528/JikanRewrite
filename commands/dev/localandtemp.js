const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('localandtemp')
    .setDescription('local and temp test result'),
    async run(discord, client, interaction) {
        let r = await client.database.getTempTimeAndLocal(interaction.user.id, interaction.guild.id);
        console.log(r);
        interaction.reply("Check console");
    }
}