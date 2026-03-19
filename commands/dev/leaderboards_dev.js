const { SlashCommandBuilder } = require('discord.js')
const { code_block, ms_convert, getLocaleTranslation, localizationTemplate } = require('../../static/utils');
const { lodash_chunk: chunk } = require('lodash');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('leaderboards_dev')
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
                value: 'global' 
            },
            { 
                name: getLocaleTranslation('en-US', 'common.local'),
                name_localizations: localizationTemplate('common.local'),
                value: 'local' 
            },
            { 
                name: getLocaleTranslation('en-US', 'common.realtime'),
                name_localizations: localizationTemplate('common.realtime'),
                value: 'realtime' 
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
        const selected_scope = interaction.options.getString('scope') || 'global';
        const selected_value = interaction.options.getString('value') || 'vc_time';
        const selected_order = interaction.options.getString('order') || 'desc';
        
        let lb = await client.database.getLeaderboardFrom(
            selected_scope, 
            interaction.guild.id, 
            selected_value,
            selected_order
        );

        //lb = lb.slice(0, 1)

        // build embed
        // the structure of lb are as follows:
        //
        // [
        //      {user_id: 'id', user_name: 'name', vc_time: time}, ...
        // ]

        console.log(lb);

        let leaderboard_contents = "";
        let embed;

        if (lb.length > 0) {
            lb.forEach((user, index) => {
                leaderboard_contents += `${index + 1}. ${user.user_name} ${selected_value == "user_id" ? `[${user.user_id}]` : ''} - ${selected_scope == "realtime" && user.vc_time != 0
                    ? ms_convert(Date.now() - user.vc_time)
                    : ms_convert(user.vc_time)}\n`;
                // if TEMP is selected, vc_time is actually the timestamp they joined, so we need to do Date.now() - vc_time
                // to get their current time in VC.
                //
                // Now if the vc_time is 0, it means they are not in VC, so we just show 0.000s
            });
        }

        embed = new discord.EmbedBuilder()
            .setTitle(selected_scope == 'global' ? getLocaleTranslation(interaction.locale, 'leaderboard_titles.global') : selected_scope == 'local' ? `${getLocaleTranslation(interaction.locale, 'leaderboard_titles.local', interaction.guild.name)}` : `${getLocaleTranslation(interaction.locale, 'leaderboard_titles.realtime', interaction.guild.name)}`)
            .setDescription(`${
                lb.length > 0 ? code_block(leaderboard_contents) :
                `:warning: ${getLocaleTranslation(interaction.locale, 'commands.public.leaderboards.embeds.no_users',
                    getLocaleTranslation(interaction.locale, `leaderboard_titles.${selected_scope}`))} :warning:\n\n${getLocaleTranslation(interaction.locale, 'commands.public.leaderboards.embeds.no_users_reason')}`}\n
                ${
                getLocaleTranslation(interaction.locale, 'commands.public.leaderboards.embeds.sort_footer',
                getLocaleTranslation(interaction.locale, `common.${selected_value}`),
                getLocaleTranslation(interaction.locale, `common.${selected_order}`))}`)
            .setColor('#0099ff');
        interaction.reply({ embeds: [embed] });
    }
}