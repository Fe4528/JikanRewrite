const { SlashCommandBuilder } = require('discord.js')
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription('local and temp test result'),
    async run(client, interaction) {
        let r = await JikanMySQLDatabase.getJikanTempTimeAndLocal(interaction.user.id, interaction.guildId);
        console.log(r);
        interaction.reply("Check console");
    }
}