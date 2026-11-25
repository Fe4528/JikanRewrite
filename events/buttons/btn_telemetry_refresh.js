const { code_block } = require('#jikan/utils.js');
const Telemetry = require('#jikan/telemetry.js');

module.exports = {
    custom_id: "JIKAN_BTN_TELEMETRY_REFRESH",
    async run (client, interaction) {
        await interaction.deferUpdate();
        const tele_result = await Telemetry.getTelemetryResult();

        interaction.editReply(code_block(tele_result + `\n\n\nUpdated at ${Date()}`));
    }
}