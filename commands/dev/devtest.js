const { SlashCommandBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
    .setName('devtest')
    .setDescription('dev test'),
    async run(discord, client, interaction) {
        interaction.reply("dev test");
    }
}