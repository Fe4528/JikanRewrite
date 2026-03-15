const { SlashCommandBuilder } = require('discord.js');
const { code_block } = require('../../utils.js');
const telemetry = require('../../telemetry.js');


module.exports = {
    data: new SlashCommandBuilder()
    .setName('telemetry')
    .setDescription('Telemetry for Jikan MySQL Manager'),
    async run(discord, client, interaction) {
        const tele_result = await telemetry.getTelemetryResult();

        interaction.reply({
            content: code_block(tele_result),
            components: [
                new discord.ActionRowBuilder()
                .addComponents(
                    new discord.ButtonBuilder()
                    .setLabel("Refresh")
                    .setCustomId("JIKAN_TELEMETRY_REFRESH")
                    .setStyle("Secondary")
                )
            ]
        });
    }
}