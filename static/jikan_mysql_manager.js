const mysql = require("mysql2/promise");
const { JikanDBError, consoleColor, ms_convert } = require("./utils.js");
const telemetry = require("./telemetry.js");

class JikanMySQLDatabase {
    static {
        console.log(consoleColor("Trying to connect to MySQL server", "yellow"));

        this.pool = mysql.createPool({
            host: process.env.MYSQL_ENDPOINT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DBNAME,
            port: process.env.MYSQL_PORT,
            waitForConnections: true,
            connectionLimit: 4,
            queueLimit: 0
        });
    }

    /**
     * Add user in global index (not GlobalLeaderboards)
     * @param {object} params
     * @param {string} params.user_id
     * @param {string} params.user_name
     */
    static async addUser(params) {
        try {
            this.pool.execute('insert ignore into JikanUser (user_id, user_name, is_hidden) values (?, ?, ?)', [
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
        // in testing, this should remove the datas because i will
        // simulate an "on join" event so i don't have to
        // kick the bot and join multiple times

        // make data
        // not sure if i need to use await here...
        // but we're not waiting for any data so
        // it should be good
        try { 
            this.pool.execute('insert ignore into JikanGuildSettings (server_id) values (?)', [id])
            // server settings

            this.pool.execute(`create table if not exists JikanGuildLeaderboard_${id} (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)`);
            // local leaderboard for server

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
            const [rows] = await this.pool.query(
                `select 
                    userdb.user_id,
                    local.vc_time as local_time,
                    global.vc_time as global_time,
                    temp.vc_time as temp_time
                from JikanUser
                    as userdb
                left join JikanGlobalLeaderboard
                    as global on userdb.user_id = global.user_id
                left join JikanGuildLeaderboard_${guild_id} 
                    as local on global.user_id = local.user_id
                left join JikanGuildLeaderboardTemp_${guild_id} 
                    as temp on global.user_id = temp.user_id
                where userdb.user_id = (?)`, [user_id]
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
            const [rows] = await this.pool.query(
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
     * Get leaderboard
     * @param {string} type
     * @param {string} guild_id
     * @param {string} value
     * @param {string} order
     */
    static async getLeaderboardFrom(type, guild_id = null, value = "vc_time", order = "desc") {
        try {
            const table = this.getLeaderboardScope(type, guild_id);
            const [rows] = await this.pool.query(
                `select * from ${table} order by ${value} ${order}`
            );

            telemetry.log("get_leaderboard_from", "_calls");
            return rows;
        }
        catch (e) {
            telemetry.log("get_leaderboard_from", "_errors");
            throw new JikanDBError(e.message);
        }
    }

    /**
     * Get leaderboard table name
     * @param {string} type GLOBAL | LOCAL | TEMP
     * @param {string} guild_id
     */
    static getLeaderboardScope(type, guild_id) {
        switch (type.toUpperCase()) {
            case "GLOBAL":
                telemetry.log("get_leaderboard_scope", "_calls");
                return "JikanGlobalLeaderboard";
            case "LOCAL":
                telemetry.log("get_leaderboard_scope", "_calls");
                return `JikanGuildLeaderboard_${guild_id}`;
            case "REALTIME":
                telemetry.log("get_leaderboard_scope", "_calls");
                return `JikanGuildLeaderboardTemp_${guild_id}`;
            default:
                telemetry.log("get_leaderboard_scope", "_errors");
                throw new JikanDBError("Invalid leaderboard scope");
        }
    }

    /**
     * Get user from leaderboard
     * @param {object} params
     * @returns {object|null}
     */
    static async getUser(params) {
        try {
            const table = this.getLeaderboardScope(params.type, params.guild_id);

            const [rows] = await this.pool.query(
                `select * from ${table} where user_id = ?`,
                [params.id]
            );

            telemetry.log("get_user", "_calls");
            return rows.length ? rows[0] : null;

        }
        catch (e) {
            telemetry.log("get_user", "_errors");
            throw new JikanDBError(e.message);
        }
    }

    /**
     * Get time entry from leaderboard
     * @param {string} user_id
     * @param {string} guild_id
     * @param {string} scope
     * @returns {object|null}
     */
    static async getUserTimeFrom(user_id, guild_id, scope) {

        try {
            const table = this.getLeaderboardScope(scope, guild_id);
            const [rows] = await this.pool.query(
                `select * from ${table} where user_id = ?`,
                [user_id]
            );

            telemetry.log("get_user_time_from", "_calls");
            return rows.length ? rows[0] : null;
        }
        catch (e) {
            telemetry.log("get_user_time_from", "_errors");
            throw new JikanDBError(e.message);
        }
    }

    /**
     * Update user VC time
     * @param {object} params
     */
    static async updateUserTime(params) {
        try {
            if (!params.id || (!params.user_name && params.mode !== "DELETE") || !params.guild_id) {
                console.log("One or more param is missing");
                return;
            }

            const table = this.getLeaderboardScope(params.type, params.guild_id);
            if (params.mode == "DELETE") {
                await this.pool.query(
                    `delete from ${table} where user_id = ?`,
                    [params.id]
                );
                return;
            }

            let query;

            if (params.mode == "UPDATE") {
                query = `
                insert into ${table} (user_id, user_name, vc_time)
                values (?, ?, ?)
                on duplicate key update
                    vc_time = vc_time + values(vc_time),
                    user_name = values(user_name)
                `;
            }
            else if (params.mode == "SET") {
                query = `
                insert into ${table} (user_id, user_name, vc_time)
                values (?, ?, ?)
                on duplicate key update
                    vc_time = values(vc_time),
                    user_name = values(user_name)
                `;
            }
            else {
                throw new JikanDBError(`Unsupported mode: ${params.mode}`);
            }

            await this.pool.query(query, [
                params.id,
                params.user_name,
                params.current_time
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
            const [rows] = await this.pool.query(
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
