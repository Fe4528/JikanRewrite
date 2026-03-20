const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('simulate_guildjoin')
    .setDescription('command.description'),
    async run(discord, client, interaction) {
        await client.database.createServerData(interaction.guild.id);

        interaction.reply("Simulated guild join event for database. Note that it also resets if any tables are present");
    }
}