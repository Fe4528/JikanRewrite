const { SlashCommandBuilder } = require('discord.js')
const { code_block, ms_convert, getLocaleTranslation, localizationTemplate } = require('../../utils');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('leaderboards')
    .setDescription('test leaderboards')
    .addStringOption(option => 
        option
        .setName('scope')
        .setDescription('Leaderboard to show')
        .setDescriptionLocalizations(localizationTemplate('commands.public.leaderboards.options.scope.description'))
        .addChoices(
            {
                name: getLocaleTranslation('en-US', 'common.global'),
                name_localizations: localizationTemplate('common.global'),
                value: 'GLOBAL' 
            },
            { 
                name: getLocaleTranslation('en-US', 'common.local'),
                name_localizations: localizationTemplate('common.local'),
                value: 'LOCAL' 
            },
            { 
                name: getLocaleTranslation('en-US', 'common.realtime'),
                name_localizations: localizationTemplate('common.realtime'),
                value: 'TEMP' 
            }
        )
        .setRequired(true)
    )
    .addStringOption(option => 
        option
        .setName('value')
        .setDescription('Which value')
        .setDescriptionLocalizations(localizationTemplate('commands.public.leaderboards.options.value.description'))
        .addChoices(
            { 
                name: getLocaleTranslation('en-US', 'common.vc_time'),
                name_localizations: localizationTemplate('common.vc_time'),
                value: 'vc_time' 
            },
            { 
                name: getLocaleTranslation('en-US', 'common.user_id'), 
                name_localizations: localizationTemplate('common.user_id'),
                value: 'user_id' 
            },
            { 
                name: getLocaleTranslation('en-US', 'common.user_name'), 
                name_localizations: localizationTemplate('common.user_name'),
                value: 'user_name' 
            }
        )
    )
    .addStringOption(option => 
        option
        .setName('order')
        .setDescription('Ascending or Descending')
        .setDescriptionLocalizations(localizationTemplate('commands.public.leaderboards.options.order.description'))
        .addChoices(
            { 
                name: getLocaleTranslation('en-US', 'common.desc'),
                name_localizations: localizationTemplate('common.desc'),
                value: 'desc' 
            },
            { 
                name: getLocaleTranslation('en-US', 'common.asc'),
                name_localizations: localizationTemplate('common.asc'),
                value: 'asc' 
            }
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
            leaderboard_contents += `${index + 1}. ${user.user_name} ${selected_value == "user_id" ? `[${user.user_id}]` : ''} - ${selected_scope == "TEMP" && user.vc_time != 0 
                ? ms_convert(Date.now() - user.vc_time) 
                : ms_convert(user.vc_time)}\n`;
            // if TEMP is selected, vc_time is actually the timestamp they joined, so we need to do Date.now() - vc_time
            // to get their current time in VC.
            //
            // Now if the vc_time is 0, it means they are not in VC, so we just show 0.000s
        });


        const embed = new discord.EmbedBuilder()
            .setTitle(selected_scope == 'GLOBAL' ? getLocaleTranslation(interaction.locale, 'leaderboard_titles.global') : selected_scope == 'LOCAL' ? `${getLocaleTranslation(interaction.locale, 'leaderboard_titles.local', interaction.guild.name)}` : `${getLocaleTranslation(interaction.locale, 'leaderboard_titles.realtime', interaction.guild.name)}`)
            .setDescription(`${code_block(leaderboard_contents)}\n${getLocaleTranslation(interaction.locale, 'commands.public.leaderboards.embeds.sort_footer', getLocaleTranslation(interaction.locale, `common.${selected_value}`), getLocaleTranslation(interaction.locale, `common.${selected_order}`))}`)
            .setColor('#0099ff');
        interaction.reply({ embeds: [embed] });
    }
}