const { SlashCommandBuilder } = require('discord.js');
const { code_block, ms_convert, getLocaleTranslation } = require('../../utils');


module.exports = {
    data: new SlashCommandBuilder()
    .setName('getalltime')
    .setDescription(getLocaleTranslation('en-US', 'commands.dev.getalltime.description')),
    async run(discord, client, interaction) {
        const time = await client.database.getAllUserTime(interaction.user.id, interaction.guild.id);
        interaction.reply(code_block(`USER: ${time.user_id}\n\nGLOBAL: ${time.global_time} (${ms_convert(time.global_time)})\nLOCAL: ${time.local_time} (${ms_convert(time.local_time)})\nTEMP: ${time.temp_time} (${ms_convert(time.temp_time)})`));
    }
}