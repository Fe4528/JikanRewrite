const { ms_convert } = require("./utils");

const helper_methods = /** @type {const} */([
    "check_guild_db_availability",
    "check_if_db_table_exists",
    "create_server_data",
    "get_all_user_time",
    "get_ban_list",
    "get_leaderboard_from",
    "get_leaderboard_scope",
    "get_user",
    "get_user_time_from",
    "get_table_names",
    "update_user_time",
    "user_exists",
    "user_exists_in_leaderboard",
]);

const types = /** @type {const} */ ([
    "_calls",
    "_errors"
])

class MySQLTelemetry {
    static {
        this.time_started = Date.now();

        console.log("Got %s telemetry attributes.", helper_methods.length);

        helper_methods.forEach((e) => {
            this[e + "_calls"] = 0;
            this[e + "_errors"] = 0;
        })

        //console.log(this);
    }

    /**
     * Count telemetry data
     * @param {typeof helper_methods[number]} prop - log what
     * @param {typeof types[number]} type - type of state to log
     */
    static log(prop, type) {
        if (!type) throw new Error("type parameter is needed");

        const key = prop + type;

        if (key in this) {
            //console.log(`Incremented ${key}`);
            this[key] += 1;
        } else {
            throw new Error(`${key} is not a member of MySQLTelemetry`);
        }
    }

    static getTelemetryResult() {
        let result = ""

        result += `Uptime: ${ms_convert(Date.now() - this.time_started)}\n\n\n`;
        result += "=== CALLS (successful runs) ===\n";
        result += helper_methods.map(v => `${this[`${v}_calls`]} ${v}`).join("\n");
        result += "\n\n";
        result += "=== ERRORS ===\n";
        result += helper_methods.map(v => `${this[`${v}_errors`]} ${v}`).join("\n");

        return result;
    }
}

module.exports = MySQLTelemetry;