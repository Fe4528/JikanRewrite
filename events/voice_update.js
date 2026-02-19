const { JikanDBError, ms_convert, consoleColor } = require("../utils")

//client has the database object

module.exports.changeDetected = async (os, ns, client) => {
    const jdb = client.database;
    const guild = ns.guild;
    const member = ns.member;

    if (!ns.member) {
        console.log(consoleColor("Cannot find member.", "yellow"));
        return;
    }

    try {
        if (ns.channel) {
            // left or switched channels
            //
            // check first if temp time is 0
            // because it means they haven't joined a vc

            const time_now = Date;

            const local_time = await jdb.getTempTimeAndLocal(member.id, guild.id);
            if (local_time?.temp_time == undefined || local_time.temp_time == 0 || local_time.length < 1) {
                // no data | not joined in vc

                await jdb.updateUserTime({ guild_id: guild.id, id: member.id, type: "TEMP", current_time: time_now.now(), user_name: member.user.username, mode: "SET" })
                console.log(`User %s SET time`, member.id);
            } else {
                console.log(`User %s moved to Channel %s`, member.id, ns.channel.id);
            }

            console.log("User %s joined Channel %s", member.id, ns.channel.id);
            console.log("\nInfo for %s:\nUsername: \t%s\nJoin time: \t%s\n", member.id, member.user.username, time_now());
        } else if (!ns.channel && os.channel) {
            // left vc
            if (!await jdb.userExists(member.id)) {
                console.log(consoleColor(`User ${member.id} is not yet saved in global record (in JikanUser)`, "yellow"));
                return;
            }

            const date = Date;
            const date_now = date.now()
            const old_time = await jdb.getAllUserTime(member.id, guild.id);
            const time_spent_after_leaving = date_now - old_time.temp_time;

            if (time_spent_after_leaving == date_now) {
                // means temp time is 0 and time spent is the same as the leave timestamp
                // either the user left vc without a record in JikanGuildLeaderboardTemp_
                // happens when user left vc while Jikan just started

                console.log(consoleColor(`User ${member.id} illegal operation (User not found in JikanGuildLeaderboardTemp_${guild.id})`, "red"));
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
            await jdb.updateUserTime({ guild_id: guild.id, id: member.id, type: "TEMP", current_time: 0, user_name: member.user.username, mode: "SET" });

            console.log("User %s TEMP time has been set", member.id);

            console.log("User %s left Channel %s", member.id, os.channel.id)
            console.log("\nInfo for %s:\nUsername: \t%s\nLeave time: \t%s\nVC Time: \t%s\n", member.id, member.user.username, date(), ms_convert(time_spent_after_leaving));
        }
    } catch (e) {
        if (e instanceof JikanDBError) {
            console.log(e.reason);
        } else {
            console.log(e.stack);
        }
    }
}