const { JikanDBError } = require("../utils")

//client has the database object

module.exports.changeDetected = (os, ns, client) => {
    let jdb = client.database;
    try {
        if (ns.channel) {
            // left or switched channels
            jdb.updateUserTime({
                guild_id: ns.guild.id,
                id: ns.member.id,
                type: "TEMP",
                vc_time: Date.now()
            })
            console.log("Found user: %s", ns.member.id);
        } else if (!ns.channel && os.channel) {
            // left vc

            console.log("User left: %s", os.member.id)
        }
    } catch(e) {
        if (e instanceof JikanDBError) {
            console.log(e.reason);
        } else {
            console.log(e.stack);
        }
    }
}