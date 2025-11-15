const { SlashCommandBuilder } = require('discord.js');
const { JikanDBError, code_block } = require('../../utils');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('getuser')
    .setDescription('get user by id')
    .addStringOption(i => i
        .setName('user_id')
        .setDescription('user id')
        .setRequired(true)
    ),
    async run(discord, client, interaction) {
        const res = await client.database.getUser({
            id: interaction.options.getString("user_id").trim(),
            guild_id: interaction.guild.id,
            scope: "GLOBAL"
        });
            
        if (res instanceof JikanDBError) {
            return interaction.reply(code_block(res.reason));
        }

        interaction.reply(`\`\`\`\nUser Info:\n\nUsername: ${res.user_name}\nUser ID: ${res.user_id}\nVC Time: ${res.vc_time}\nIs Hidden: ${res.is_hidden}\n\`\`\``);
    }
}