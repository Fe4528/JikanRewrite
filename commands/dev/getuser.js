const { SlashCommandBuilder } = require('discord.js');
const { JikanDBError, code_block, ms_convert, getLocaleTranslation } = require('../../static/utils.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('getuser')
    .setDescription(getLocaleTranslation('en-US', 'commands.dev.getuser.description'))
    .setDescriptionLocalizations({
        "ja": getLocaleTranslation("ja", "commands.dev.getuser.description")
    })
    .addStringOption(i => i
        .setName('user_id')
        .setDescription(getLocaleTranslation('en-US', 'commands.dev.getuser.options.user_id.description'))
        .setDescriptionLocalizations({
            "ja": getLocaleTranslation("ja", "commands.dev.getuser.options.user_id.description")
        })
        .setRequired(true)
    ),
    async run(discord, client, interaction) {
        const res = await client.database.getUser({
            id: interaction.options.getString("user_id").trim(),
            guild_id: interaction.guild.id,
            type: "GLOBAL"
        });
            
        if (res instanceof JikanDBError) {
            return interaction.reply(code_block(res.reason));
        }

        interaction.reply(`\`\`\`\nUser Info:\n\nUsername: ${res.user_name}\nUser ID: ${res.user_id}\nVC Time: ${res.vc_time}ms (${ms_convert(res.vc_time)})\nIs Hidden: ${res.is_hidden}\n\`\`\``);
    }
}