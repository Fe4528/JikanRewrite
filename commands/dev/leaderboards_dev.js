const { code_block, ms_convert, getLocaleTranslation, localizationTemplate, chunk } = require('../../static/utils.js');
const TempTime = require("../../static/temptime.js");

const { SlashCommandBuilder } = require('discord.js');
const { Pagination } = require("pagination.djs");
const path = require('path');

function formatLeaderboardRow(user, ranking, selected_scope, selected_value) {
    const displayTime = (selected_scope === "realtime" && user.vc_time !== 0)
        ? ms_convert(Date.now() - user.vc_time)
        : ms_convert(user.vc_time);

    return `${ranking}. ${user.user_name}${selected_value == "user_id" ? `[${user.user_id}]` : ''} - ${displayTime}`;
}

function getMyRankingString(lb_map, interaction, selected_scope) {
    const mydata = lb_map.get(interaction.user.id);
    if (!mydata) {
        return getLocaleTranslation(interaction.locale, 'commands.public.leaderboards.myrank_not_found');
    }

    const { rank, data } = mydata;
    const mytime = (selected_scope === "realtime" && data.vc_time !== 0)
        ? ms_convert(Date.now() - data.vc_time)
        : ms_convert(data.vc_time);

    return `${rank}. ${interaction.user.username} - ${mytime}`;
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName(path.basename(__filename).split('.')[0])
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
        const guild = interaction.guild;
        const time_took = Date.now();
        
        let lb;

        await interaction.deferReply();

        if (selected_scope !== "realtime") {
            lb = await client.database.getLeaderboardFrom(
                selected_scope, 
                guild.id, 
                selected_value,
                selected_order
            );
        } else {
            // since temp data is stored in RAM (the TempTime bullshit)
            lb = TempTime.getSortedUsers(guild.id, {
                value: selected_value,
                order: selected_order
            });
        }
        

        //lb = lb.slice(0, 1)

        // build embed
        // the structure of lb are as follows:
        //
        // [
        //      {user_id: 'id', user_name: 'name', vc_time: time}, ...
        // ]

        

        let leaderboard_contents = [];
        let ranking = 0;
        let embed;

        // Optimized Map lookup cache index
        const lb_map = new Map();

        const pagination = new Pagination(interaction, {
            firstEmoji: "⏮️",
            prevEmoji: "◀️",
            nextEmoji: "▶️",
            lastEmoji: "⏭️",
            buttonStyle: "Secondary",
            idle: 60000,
            limit: 1
        })

        if (lb && lb.length > 0) {
            for (const user of lb) {
                ranking++;

                lb_map.set(user.user_id, { rank: ranking, data: user });

                leaderboard_contents.push(
                    formatLeaderboardRow(user, ranking, selected_scope, selected_value)
                );
            }
        } else {
            leaderboard_contents = 
                `:warning: ${getLocaleTranslation(interaction.locale, 'commands.public.leaderboards.embeds.no_users',
                getLocaleTranslation(interaction.locale, `leaderboard_titles.${selected_scope}`))} :warning:\n\n${getLocaleTranslation(interaction.locale, 'commands.public.leaderboards.embeds.no_users_reason')}\n
                ${
                    getLocaleTranslation(interaction.locale, 'commands.public.leaderboards.embeds.sort_footer',
                    getLocaleTranslation(interaction.locale, `common.${selected_value}`),
                    getLocaleTranslation(interaction.locale, `common.${selected_order}`))
                }
                `;
        }

        const myrank_value = getMyRankingString(lb_map, interaction, selected_scope);

        let lb_entry_chunk;
        if (typeof leaderboard_contents != 'string') {
            const chunked = chunk(leaderboard_contents, 20).map(c => code_block(c.join("\n")) + `\n### Your rank:\n${code_block(myrank_value)}`);
            lb_entry_chunk = selected_scope == "global" ? chunked.slice(0, 20) : chunked;
        } else {
            lb_entry_chunk = [leaderboard_contents];
        }
        
        /*
        global lb is limited to 400 users whereas local/realtime isnt

        leaderboard_contents [
            "1. fe4528 - 10s",
            "2. namehere - timehere"
        ]
        */

        /*
        user [
            { user data },
            { user data 2},
            ...
        ]
        */

        pagination
            .setTitle(selected_scope == 'global' ? getLocaleTranslation(interaction.locale, 'leaderboard_titles.global') : selected_scope == 'local' ? `${getLocaleTranslation(interaction.locale, 'leaderboard_titles.local', interaction.guild.name)}` : `${getLocaleTranslation(interaction.locale, 'leaderboard_titles.realtime', interaction.guild.name)}`)
            .setDescriptions(lb_entry_chunk)
            .setColor('#ffffff')
            .setFooter({ text: `{pageNumber}/{totalPages} | ${Date.now() - time_took}ms ${(lb ? lb.length : 0)} user(s) | ${
                getLocaleTranslation(interaction.locale, 'commands.public.leaderboards.embeds.sort_footer',
                getLocaleTranslation(interaction.locale, `common.${selected_value}`),
                getLocaleTranslation(interaction.locale, `common.${selected_order}`))
            }`});

        pagination.render();
    }
}