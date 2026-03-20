const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('publictest')
    .setDescription('public test'),
    async run(discord, client, interaction) {
        interaction.reply(`This is a public test`);
    }
}