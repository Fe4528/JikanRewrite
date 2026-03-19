const { code_block } = require('../static/utils.js');
const telemetry = require('../static/telemetry.js');

module.exports = {
    async run(discord, client, interaction) {
        switch (interaction.customId) {
            case "JIKAN_TELEMETRY_REFRESH":
                await interaction.deferUpdate();
                const tele_result = await telemetry.getTelemetryResult();

                interaction.editReply(code_block(tele_result + `\n\n\nUpdated at ${Date()}`));

                break;
        }
    }
}