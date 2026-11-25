const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('publictest')
    .setDescription('public test'),
    async run(client, interaction) {
        interaction.reply(`ignore this`);
    }
}