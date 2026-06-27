const { SlashCommandBuilder } = require('discord.js')
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription('command.description')
    .addStringOption(option => 
        option
        .setName('server_id')
		.setDescription("Simulate guildCreate for a server")
    ),
    async run(discord, client, interaction) {
        let selected_id = interaction.options.getString("server_id");
        let guild = await client.guilds.fetch(selected_id);
        
        if (!guild) return interaction.reply("Invalid guild");
        
        await client.database.createServerData(selected_id);

        interaction.reply("Simulated guild join event for database. Note that it also resets if any tables are present");
    }
}