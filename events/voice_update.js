
const { JikanDBError, ms_convert, consoleColor } = require('#jikan/utils.js')
const JikanTempTime = require("#jikan/jikan_temptime.js")
const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanWebhookManager = require("#jikan/jikan_webhook.js")
const JikanCache = require("#jikan/jikan_cache.js")
//client has the database object

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

    const locale = JikanCache.getServerLangCache(guild.id)

    try {
        const server_temp = JikanTempTime.getServer(guild.id);

        if (!server_temp) {
            console.log(consoleColor(`Cannot find JikanTempTime for guild ${guild.id}.`, "yellow"));
            return;
        }

        if (ns.channel && !os.channel) {
            const date = Date;
            const user_temp_time = server_temp.get(member.id);

            if (!await JikanMySQLDatabase.userExists(member.id)) {
                console.log(consoleColor(`User ${member.id} is not yet saved in global index record (in JikanUser, not global lb); creating...`, "yellow"));
                await JikanMySQLDatabase.addUser({
                    user_id: member.id,
                    user_name: member.user.username
                });
            }

            //console.log(temp_time);
            if (!user_temp_time) {
                // no data | not joined in vc
                //
                // || local_time.temp_time == 0 || local_time.length < 1

                //await JikanMySQLDatabase.updateUserTime({ guild_id: guild.id, id: member.id, type: "REALTIME", current_time: date.now(), user_name: member.user.username, mode: "SET" })
                JikanTempTime.addUserInServerTemp({
                    guild_id: guild.id,
                    user_id: member.id,
                    user_name: member.user.username,
                    vc_time: date.now()
                });

                await JikanWebhookManager.sendVCLog('join', member, locale, null, null, ns.channel)

                console.log(`User %s SET time`, member.id);
            } else if (user_temp_time) {
                // this block runs when user joined the channel and it detects that the user already has temp data
                //
                // happens when jikan is down while user left vc, so the user is still recorded in JikanTempTime<> Map
                // and user joined vc after Jikan application is initialized and ready to record time

                console.log(consoleColor(`User ${member.id} already has record in JikanTempTime<${guild.id}, object {}>, removing entry`, "red"));

                JikanTempTime.removeUserInServerTemp({
                    guild_id: guild.id,
                    user_id: member.id
                });

                console.log(consoleColor(`User ${member.id} entry deletion JikanTempTime<${guild.id}, object {}> Map DONE`, "red"));

                return;
            }

            console.log("User %s joined Channel %s", member.id, ns.channel.id);
            console.log("\nInfo for %s:\nUsername: \t%s\nJoin time: \t%s\n", member.id, member.user.username, date());
        }
        else if (os.channel && ns.channel) {
            // ns = new state = new channel
            // os = old state = old channel
            //
            // this block runs when it detects that the user swapped channels

            await JikanWebhookManager.sendVCLog('move', member, locale, null, os.channel, ns.channel)

            console.log(`User %s moved to Channel %s`, member.id, ns.channel.id);
        }
        else if (!ns.channel && os.channel) {
            // left vc
            const date = Date;
            const date_now = date.now();
            const old_time = server_temp.get(member.id);

            if (!old_time) {
                // if vc_time is undefined for some reason

                // means temp time does not exist
                // happens if user contains temp_data before user joins and leaves channel
                // but since we already deleted the entry earlier, temp_time in old_time variable is undefined

                console.log(consoleColor(`User ${member.id} temp time does not exist, do nothing`, "red"));
                return;
            }

            const time_spent_after_leaving = date_now - old_time.vc_time;

            if (time_spent_after_leaving <= 0) {
                // means temp time is invalid
                // this can happen if the recorded timestamp is incorrect

                console.log(consoleColor(`User ${member.id} has an invalid VC time record`, "red"));

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

            // remove temp data
            JikanTempTime.removeUserInServerTemp({
                guild_id: guild.id,
                user_id: member.id
            });

            await JikanWebhookManager.sendVCLog('leave', member, locale, time_spent_after_leaving, os.channel, null)

            console.log("User %s TEMP time has been deleted", member.id);

            console.log("User %s left Channel %s", member.id, os.channel.id)
            console.log("\nInfo for %s:\nUsername: \t%s\nLeave time: \t%s\nVC Time: \t%s [%s]\n",
                member.id,
                member.user.username,
                date(),
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
