const { SlashCommandBuilder } = require('discord.js');
const { code_block } = require('#jikan/utils.js');
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription('gettables'),
    async run(client, interaction) {
        const tables = await JikanMySQLDatabase.getTableNames();

        //console.log(tables);

        const msgtosend = tables.map((obj) => obj.TABLE_NAME).join("\n");

        interaction.reply(code_block(msgtosend));
    }
}