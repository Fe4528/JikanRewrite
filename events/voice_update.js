const { JikanDBError, ms_convert, consoleColor } = require("../utils")

//client has the database object

module.exports.changeDetected = async (os, ns, client) => {
    const jdb = client.database;
    const guild = ns.guild;
    const member = ns.member;

    if (!os.member || !ns.member) {
        console.log(consoleColor("Cannot find member.", "yellow"));
        return;
    }

    if (!guild) {
        console.log(consoleColor("Cannot find guild.", "yellow"));
        return;
    }

    try {
        if (ns.channel && !os.channel) {
            const date = Date;

            const temp_time = await jdb.userExistsInLeaderboard("TEMP", member.id, guild.id);

            //console.log(temp_time);
            if (!temp_time) {
                // no data | not joined in vc
                //
                // || local_time.temp_time == 0 || local_time.length < 1

                await jdb.updateUserTime({ guild_id: guild.id, id: member.id, type: "TEMP", current_time: date.now(), user_name: member.user.username, mode: "SET" })
                console.log(`User %s SET time`, member.id);
            } else if (temp_time) {
                // this block runs when user joined the channel and it detects that the user already has temp data
                //
                // happens when jikan is down while user left vc, so the user is still recorded in JikanGuildLeaderboardTemp_
                // and user joined vc after Jikan application is initialized and ready to record time

                console.log(consoleColor(`User ${member.id} already has record in JikanGuildLeaderboardTemp_${guild.id}, removing entry`, "red"));
                await jdb.updateUserTime({ guild_id: guild.id, id: member.id, type: "TEMP", mode: "DELETE" });
                console.log(consoleColor(`User ${member.id} entry deletion JikanGuildLeaderboardTemp_${guild.id} DONE`, "red"));

                return;
            }

            console.log("User %s joined Channel %s", member.id, ns.channel.id);
            console.log("\nInfo for %s:\nUsername: \t%s\nJoin time: \t%s\n", member.id, member.user.username, date());
        } else if (os.channel && ns.channel) {
            // ns = new state = new channel
            // os = old state = old channel
            //
            // this block runs when it detects that the user swapped channels

            console.log(`User %s moved to Channel %s`, member.id, ns.channel.id);
        } else if (!ns.channel && os.channel) {
            // left vc
            if (!await jdb.userExists(member.id)) {
                console.log(consoleColor(`User ${member.id} is not yet saved in global record (in JikanUser)`, "yellow"));
                return;
            }

            const date = Date;
            const date_now = date.now()
            const old_time = await jdb.getUserTimeFrom(member.id, guild.id, "TEMP");

            if (!old_time?.vc_time) {
                // if vc_time is undefined for some reason

                // means temp time does not exist
                // happens if user contains temp_data before user joins and user leaves channel
                // but since we already deleted the entry earlier, temp_time in old_time variable is undefined

                console.log(consoleColor(`User ${member.id} temp time does not exist, do nothing`, "red"));
                return
            }

            const time_spent_after_leaving = date_now - old_time.vc_time;

            console.log(time_spent_after_leaving, date_now);
            if (time_spent_after_leaving == date_now) {
                // means temp time is 0 and time spent is the same as the leave timestamp
                // in other words, the user left vc without a record in JikanGuildLeaderboardTemp_
                // happens when user left vc while Jikan application is down or still initializing

                console.log(consoleColor(`User ${member.id} time spent in VC is same as today`, "red"));

                await jdb.updateUserTime({ guild_id: guild.id, id: member.id, type: "TEMP", mode: "DELETE" });

                console.log(consoleColor(`User ${member.id} temp time record has been deleted in JikanGuildLeaderboardTemp_${guild.id}`, "green"));

                return;
            }

            // update local
            await jdb.updateUserTime({ guild_id: guild.id, id: member.id, type: "LOCAL", current_time: time_spent_after_leaving, user_name: member.user.username, mode: "UPDATE" });
            console.log("User %s LOCAL time has been updated", member.id);

            // update global
            await jdb.updateUserTime({ guild_id: guild.id, id: member.id, type: "GLOBAL", current_time: time_spent_after_leaving, user_name: member.user.username, mode: "UPDATE" });
            console.log("User %s GLOBAL time has been updated", member.id);

            // reset temp data
            // makes sure that you set it to 0
            //await jdb.updateUserTime({ guild_id: guild.id, id: member.id, type: "TEMP", current_time: 0, user_name: member.user.username, mode: "SET" });
            // old

            await jdb.updateUserTime({ guild_id: guild.id, id: member.id, type: "TEMP", mode: "DELETE" });
            console.log("User %s TEMP time has been deleted", member.id);

            console.log("User %s left Channel %s", member.id, os.channel.id)
            console.log("\nInfo for %s:\nUsername: \t%s\nLeave time: \t%s\nVC Time: \t%s [%s]\n", member.id, member.user.username, date(), ms_convert(time_spent_after_leaving), time_spent_after_leaving);
        }
    } catch (e) {
        if (e instanceof JikanDBError) {
            console.log(e);
        } else {
            console.log(e.stack);
        }
    }
}