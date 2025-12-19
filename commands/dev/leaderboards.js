const { SlashCommandBuilder } = require('discord.js')
const { code_block, ms_convert, order_strings, value_strings } = require('../../utils');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('leaderboards')
    .setDescription('test leaderboards')
    .addStringOption(option => 
        option
        .setName('scope')
        .setDescription('leaderboard to show')
        .addChoices(
            { name: 'global', value: 'GLOBAL' },
            { name: 'local', value: 'LOCAL' },
            { name: 'realtime', value: 'TEMP' }
        )
        .setRequired(true)
    )
    .addStringOption(option => 
        option
        .setName('value')
        .setDescription('which value')
        .addChoices(
            { name: 'vc time', value: 'vc_time' },
            { name: 'user id', value: 'user_id' },
            { name: 'user name', value: 'user_name' }
        )
    )
    .addStringOption(option => 
        option
        .setName('order')
        .setDescription('sort to apply')
        .addChoices(
            { name: 'descending', value: 'desc' },
            { name: 'ascending', value: 'asc' }
        )
    ),
    async run(discord, client, interaction) {
        const selected_scope = interaction.options.getString('scope') || 'GLOBAL';
        const selected_value = interaction.options.getString('value') || 'vc_time';
        const selected_order = interaction.options.getString('order') || 'desc';
        const lb = await client.database.getLeaderboardFrom(
            selected_scope, 
            interaction.guild.id, 
            selected_value,
            selected_order
        );

        // build embed
        // the structure of lb are as follows:
        //
        // [
        //      {user_id: 'id', user_name: 'name', vc_time: time}, ...
        // ]

        console.log(lb);

        let leaderboard_contents = "";
        lb.forEach((user, index) => {
            leaderboard_contents += `${index + 1}. ${user.user_name} - ${selected_scope == "TEMP" && user.vc_time != 0 ? ms_convert(Date.now() - user.vc_time) : ms_convert(user.vc_time)}\n`;
            // if TEMP is selected, vc_time is actually the timestamp they joined, so we need to do Date.now() - vc_time
            // to get their current time in VC.
            //
            // Now if the vc_time is 0, it means they are not in VC, so we just show 0.000s
        });


        const embed = new discord.EmbedBuilder()
            .setTitle('Test Leaderboard')
            .setDescription(`${code_block(leaderboard_contents)}\nSorting by ${value_strings[selected_value]} in ${order_strings[selected_order]} order`)
            .setColor('#0099ff');
        interaction.reply({ embeds: [embed] });
    }
}