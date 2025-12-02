const { JikanDBError } = require("../utils")

//client has the database object

module.exports.changeDetected = async (os, ns, client) => {
    const jdb = client.database;
    const guild = ns.guild;
    const member = ns.member;

    try {
        if (ns.channel) {
            // left or switched channels
            await jdb.updateUserTime({
                guild_id: guild.id,
                id: member.id,
                type: "TEMP",
                current_time: Date.now(),
                user_name: member.user.username,
                mode: "SET"
            })

            console.log("Found user: %s", member.id);
        } else if (!ns.channel && os.channel) {
            // left vc

            const old_time = await jdb.getAllUserTime(member.id, guild.id);
            //console.log(old_time);
            const time_spent_after_leaving = Date.now() - old_time.temp_time;

            await jdb.updateUserTime({
                guild_id: guild.id,
                id: member.id,
                type: "LOCAL",
                current_time: time_spent_after_leaving,
                user_name: member.user.username,
                mode: "UPDATE"
            });

            await jdb.updateUserTime({
                guild_id: guild.id,
                id: member.id,
                type: "GLOBAL",
                current_time: time_spent_after_leaving,
                user_name: member.user.username,
                mode: "UPDATE"
            });

            await jdb.updateUserTime({
                guild_id: guild.id,
                id: member.id,
                type: "TEMP",
                current_time: 0,
                user_name: member.user.username,
                mode: "SET"
            });

            console.log("User left: %s", member.id)
        }
    } catch(e) {
        if (e instanceof JikanDBError) {
            console.log(e.reason);
        } else {
            console.log(e.stack);
        }
    }
}