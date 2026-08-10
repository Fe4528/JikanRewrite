const { SlashCommandBuilder } = require('discord.js')
const path = require('path');
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription('command.description')
    .addStringOption(option => 
        option
        .setName('server_id')
		.setDescription("Simulate guildCreate for a server")
        .setRequired(true)
    ),
    async run(client, interaction) {
        let selected_id = interaction.options.getString("server_id");
        let guild = await client.guilds.fetch(selected_id);
        
        if (!guild) return interaction.reply("Invalid guild");
        
        await JikanMySQLDatabase.createServerData(selected_id);

        interaction.reply(`Simulated guild join event for database creation.\nGuildID: ${selected_id}`);
    }
}