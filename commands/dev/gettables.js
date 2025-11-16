const { SlashCommandBuilder } = require('discord.js');
const { code_block } = require('../../utils');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('gettables')
    .setDescription('gettables'),
    async run(discord, client, interaction) {
        const tables = await client.database.getTableNames();
        const msgtosend = tables.map((obj) => obj.table_name).join("\n");

        interaction.reply(code_block(msgtosend));
    }
}