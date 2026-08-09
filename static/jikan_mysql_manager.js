const mysql = require("mysql2/promise");
const { JikanDBError, consoleColor, ms_convert } = require('#jikan/utils.js');
const telemetry = require("#jikan/telemetry.js");

class JikanMySQLDatabase {
    static {
        console.log(consoleColor("Trying to connect to MySQL server", "yellow"));
    }
    
    static #pool = mysql.createPool({
        host: process.env.MYSQL_ENDPOINT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DBNAME,
        port: process.env.MYSQL_PORT,
        waitForConnections: true,
        connectionLimit: 4,
        queueLimit: 0
    });

    /**
     * Add user in global index (not GlobalLeaderboards)
     * @param {object} params
     * @param {string} params.user_id
     * @param {string} params.user_name
     */
    static async addUser(params) {
        try {
             await this.#pool.execute('insert ignore into JikanUser (user_id, user_name, is_hidden) values (?, ?, ?)', [
                params.user_id,
                params.user_name,
                0
            ]);

            telemetry.log("add_user", "_calls");
        } catch (e) {
            telemetry.log("add_user", "_errors");

            throw new JikanDBError(e.message);
        }
    }

    /**
     * Create data for this guild
     * @param {string} id
     */
    static async createServerData(id) {
        let connection;

        try {
            // server settings and local leaderboard for server
            const query = "insert ignore into JikanGuildSettings (server_id) values (?);";
            // if it works it works i guess

            await this.#pool.query(query, [id])
            

            telemetry.log("create_server_data", "_calls");
            console.log(consoleColor(`Finished initializing server data for ${id}`, "green"));
        } catch (e) {
            telemetry.log("create_server_data", "_errors");

            throw new JikanDBError(e.message);
        }
    }

    /**
     * Get all user time
     * @param {string} user_id - user id
     * @param {string} guild_id - the guild id
     */
    static async getAllUserTime(user_id, guild_id) {
        try {
            const [rows] = await this.#pool.query(
                `select 
                    userdb.user_id,
                    coalesce(userdb.is_hidden, 0) as user_hidden,
                    coalesce(sum(case when lb.server_id = ? then lb.vc_time else 0 end), 0) as local_time,
                    coalesce(sum(lb.vc_time), 0) as global_time
                from JikanUser as userdb
                left join JikanGuildLeaderboard as lb 
                    on userdb.user_id = lb.user_id
                where userdb.user_id = ?
                group by userdb.user_id, userdb.is_hidden;`, [guild_id, user_id]
            );

            telemetry.log("get_all_user_time", "_calls");

            return rows[0];
        } catch (e) {
            telemetry.log("get_all_user_time", "_errors");
            throw new JikanDBError(e.message);
        }
    }

    /**
     * Get banlist
     */
    static async getBanList() {
        try {
            const [rows] = await this.#pool.query(
                `select id from JikanBannedIDs`
            );

            telemetry.log("get_ban_list", "_calls");

            return rows;
        }
        catch (e) {
            telemetry.log("get_ban_list", "_errors");
            throw new JikanDBError(e.message);
        }
    }

    /**
     * Used for the compare command
     * @param {object} params
     * @param {string} params.server_id Server ID
     * @param {string} params.uid_1 User 1
     * @param {string} params.uid_2 User 2
     * @param {string} scope
     */
    static async getBothUserTime(params, scope) {
    try {
        let query = `
            select
                coalesce(sum(case when user_id = ? then vc_time else 0 end), 0) as user1_time,
                coalesce(sum(case when user_id = ? then vc_time else 0 end), 0) as user2_time
            from JikanGuildLeaderboard
        `;

        const query_params = [params.uid_1, params.uid_2];

        if (scope != "global") {
            query += ` where server_id = ?`;
            query_params.push(params.server_id);
        }
        const [rows] = await this.#pool.query(query, query_params);
        telemetry.log('get_both_user_time', '_calls');
        return rows[0]; 
    } catch(e) {
        telemetry.log('get_both_user_time', '_errors');
        throw e;
    }
}

    /**
     * Get leaderboard
     * 
     * @param {object} obj 
     * @param {string} obj.type Type of scope (global or local)
     * @param {string} obj.guild_id The ID of the server
     * @param {string} obj.value [Sorting] What value to sort
     * @param {string} obj.order [Sorting] Sort list (asc or desc)
     */
    // type, guild_id = null, value = "vc_time", order = "desc"
    static async getLeaderboardFrom(obj) {
        try {
            const user_selected_type = obj.type.toUpperCase();

            let query = ``;
            let params = [];

            if (user_selected_type === "GLOBAL") {
                query = `select user_id, max(user_name) as user_name, sum(vc_time) as vc_time
                    from JikanGuildLeaderboard
                    group by user_id
                    order by vc_time ${obj.order}`;
            } else {
                query = `select * from JikanGuildLeaderboard 
                    where server_id = ? 
                    order by ${obj.value} ${obj.order}`;
                params.push(obj.guild_id);
            }

            const [rows] = await this.#pool.query(query, params);

            telemetry.log("get_leaderboard_from", "_calls");
            return rows;
        }
        catch (e) {
            telemetry.log("get_leaderboard_from", "_errors");
            throw new JikanDBError(e.message);
        }
    }

    /**
     * Get the language set for the server
     * @param {string} id 
     */
    static async getServerLocale(id) {
        try {
            const [rows] = await this.#pool.query(
                `select server_locale from JikanGuildSettings where server_id = ?`,
                [id]
            );

            telemetry.log('get_server_lang', '_calls');

            return rows[0].server_locale;
        } catch(e) {
            telemetry.log('get_server_lang', '_errors');
            throw new JikanDBError(e.message);
        }
    }

    /**
     * Update user VC time
     * @param {object} params
     * @param {string} params.current_time The user's accumulated time
     * @param {string} params.guild_id Guild ID
     * @param {string} params.id User ID
     * @param {string} params.mode Mode of transaction to
     * @param {string} params.user_name User name
     * 
     */
    static async updateUserTime(params) {
        try {
            if (!params.id || (!params.user_name && params.mode !== "DELETE") || !params.guild_id) {
                console.log("One or more param is missing");
                return;
            }

            let query = `
                insert into JikanGuildLeaderboard (user_id, user_name, vc_time, server_id)
                values (?, ?, ?, ?) as new_data
                on duplicate key update
                    vc_time = JikanGuildLeaderboard.vc_time + new_data.vc_time,
                    user_name = new_data.user_name
                `;

            await this.#pool.query(query, [
                params.id,
                params.user_name,
                params.current_time,
                params.guild_id
            ]);

            telemetry.log("update_user_time", "_calls");
        }
        catch (e) {
            telemetry.log("update_user_time", "_errors");
            throw new JikanDBError(e.message);
        }
    }

    /**
     * Check if user exists globally
     * @param {string} user_id
     * @returns {boolean}
     */
    static async userExists(user_id) {

        try {
            const [rows] = await this.#pool.query(
                "select 1 from JikanUser where user_id = ? limit 1",
                [user_id]
            );

            telemetry.log("user_exists", "_calls");
            return rows.length > 0;
        }
        catch (e) {
            telemetry.log("user_exists", "_errors");
            throw new JikanDBError(e.message);
        }
    }
}

module.exports = JikanMySQLDatabase;