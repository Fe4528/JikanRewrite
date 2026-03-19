const { SlashCommandBuilder } = require('discord.js');
const { code_block } = require('../../static/utils.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('gettables')
    .setDescription('gettables'),
    async run(discord, client, interaction) {
        const tables = await client.database.getTableNames();

        //console.log(tables);

        const msgtosend = tables.map((obj) => obj.TABLE_NAME).join("\n");

        interaction.reply(code_block(msgtosend));
    }
}