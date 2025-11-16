const { JikanDBError } = require("../utils")


module.exports.changeDetected = (os, ns) => {
    try {
        if (ns.channel) {
            // joined vc

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