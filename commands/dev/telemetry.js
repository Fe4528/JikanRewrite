const { SlashCommandBuilder } = require('discord.js');
const { code_block } = require('../../static/utils.js');
const telemetry = require('../../static/telemetry.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
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