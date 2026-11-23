
const { JikanDBError, ms_convert, consoleColor } = require('#jikan/utils.js')
const JikanTempTime = require("#jikan/jikan_temptime.js")
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanWebhookManager = require("#jikan/jikan_webhook.js")
const JikanCache = require("#jikan/jikan_cache.js")
//client has the database object

const processing = new Map();

async function processChange(guild, member, old_channel, new_channel) {
    const locale = JikanCache.getServerLangCache(guild.id);

    try {
        const server_temp = JikanTempTime.getServer(guild.id);

        if (new_channel && !old_channel) {
            const date_now = Date.now();
            const user_temp_time = server_temp.get(member.id);

            await JikanMySQLDatabase.addUser({
                user_id: member.id,
                user_name: member.user.username
            });

            if (user_temp_time) {
                // previous session was left behind, possibly because the app
                // was offline when the user left so reset it and track this join
                console.log(consoleColor(
                    `User ${member.id} already has a record in JikanTempTime<${guild.id}>. Resetting entry.`,
                    "yellow"
                ));

                JikanTempTime.removeUserInServerTemp({
                    guild_id: guild.id,
                    user_id: member.id
                });
            }

            JikanTempTime.addUserInServerTemp({
                guild_id: guild.id,
                user_id: member.id,
                user_name: member.user.username,
                vc_time: date_now
            });

            JikanWebhookManager.sendVCLog(
                'join', member, locale, null, null, new_channel
            ).catch(console.error);

            console.log(`User %s SET time`, member.id);
            console.log("User %s joined Channel %s", member.id, new_channel.id);
            console.log(
                "\nInfo for %s:\nUsername: \t%s\nJoin time: \t%s\n",
                member.id,
                member.user.username,
                new Date(date_now)
            );
        }
        else if (old_channel && new_channel) {
            // ns = new state = new channel
            // os = old state = old channel
            //
            // this block runs when it detects that the user swapped channels

            JikanWebhookManager.sendVCLog(
                'move', member, locale, null, old_channel, new_channel
            ).catch(console.error);

            console.log(`User %s moved to Channel %s`, member.id, new_channel.id);
        }
        else if (!new_channel && old_channel) {
            // left vc
            const date_now = Date.now();
            const old_time = server_temp.get(member.id);

            if (!old_time) {
                // means temp time does not exist
                // happens if the bot missed the user's join event or lost its
                // temporary record during a restart

                console.log(consoleColor(
                    `User ${member.id} temp time does not exist, do nothing`,
                    "red"
                ));
                return;
            }

            const time_spent_after_leaving = date_now - old_time.vc_time;

            if (!Number.isSafeInteger(time_spent_after_leaving) ||
                time_spent_after_leaving <= 0) {
                // means temp time is invalid
                // this can happen if the recorded timestamp is incorrect

                console.log(consoleColor(
                    `User ${member.id} has an invalid VC time record`,
                    "red"
                ));

                JikanTempTime.removeUserInServerTemp({
                    guild_id: guild.id,
                    user_id: member.id
                });

                return;
            }

            // update global
            await JikanMySQLDatabase.updateUserTime({
                guild_id: guild.id,
                id: member.id,
                current_time: time_spent_after_leaving,
                user_name: member.user.username,
            });

            console.log("User %s GLOBAL time has been updated", member.id);

            // remove temp data only after the database update succeeds
            JikanTempTime.removeUserInServerTemp({
                guild_id: guild.id,
                user_id: member.id
            });

            JikanWebhookManager.sendVCLog(
                'leave', member, locale, time_spent_after_leaving, old_channel, null
            ).catch(console.error);

            console.log("User %s TEMP time has been deleted", member.id);

            console.log("User %s left Channel %s", member.id, old_channel.id);
            console.log(
                "\nInfo for %s:\nUsername: \t%s\nLeave time: \t%s\nVC Time: \t%s [%s]\n",
                member.id,
                member.user.username,
                new Date(date_now),
                ms_convert(time_spent_after_leaving),
                time_spent_after_leaving
            );
        }
    }
    catch (e) {
        if (e instanceof JikanDBError) {
            console.log(e);
        } else {
            console.log(e.stack || e);
        }
    }
}

module.exports.changeDetected = async (os, ns, client) => {
    const guild = ns.guild;
    const member = ns.member;

    if (!guild) {
        console.log(consoleColor("Cannot find guild.", "yellow"));
        return;
    }

    if (!member) {
        console.log(consoleColor("Cannot find member.", "yellow"));
        return;
    }

    const old_channel = os.channel;
    const new_channel = ns.channel;

    if (old_channel === new_channel) return;

    const key = `${guild.id}:${member.id}`;
    const previous = processing.get(key) ?? Promise.resolve();

    const current = previous.catch(e => 
        console.error("Previous voice event failed:", e)).then(() => 
            processChange(guild, member, old_channel, new_channel)
        );

    processing.set(key, current);

    try {
        await current;
    } finally {
        if (processing.get(key) === current) {
            processing.delete(key);
        }
    }
}