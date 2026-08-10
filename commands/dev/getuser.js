const { SlashCommandBuilder } = require('discord.js');
const { JikanDBError, code_block, ms_convert, getLocaleTranslation, localizationTemplate } = require('#jikan/utils.js');
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
    .setDescription(getLocaleTranslation('en-US', 'commands.dev.getuser.description'))
    .setDescriptionLocalizations(localizationTemplate('commands.dev.getuser.description'))
    .addStringOption(i => i
        .setName('user_id')
        .setDescription(getLocaleTranslation('en-US', 'commands.dev.getuser.options.user_id.description'))
        .setDescriptionLocalizations(localizationTemplate('commands.dev.getuser.options.user_id.description'))
        .setRequired(true)
    ),
    async run(client, interaction) {
        const res = await JikanMySQLDatabase.getUser({
            id: interaction.options.getString("user_id").trim(),
            guild_id: interaction.guildId,
            type: "GLOBAL"
        });
            
        if (res instanceof JikanDBError) {
            return interaction.reply(code_block(res.reason));
        }

        interaction.reply(`\`\`\`\nUser Info:\n\nUsername: ${res.user_name}\nUser ID: ${res.user_id}\nVC Time: ${res.vc_time}ms (${ms_convert(res.vc_time, interaction.jikan_server_locale)})\nIs Hidden: ${res.is_hidden}\n\`\`\``);
    }
}