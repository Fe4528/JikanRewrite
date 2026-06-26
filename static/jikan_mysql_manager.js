const mysql = require("mysql2/promise");
const { JikanDBError, consoleColor, ms_convert } = require("./utils.js");
const telemetry = require("./telemetry.js");

class JikanMySQLDatabase {
    static {
        console.log(consoleColor("Trying to connect to MySQL server", "yellow"));
        const start = Date.now();

        this.pool = mysql.createPool({
            host: process.env.MYSQL_ENDPOINT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD,
            database: process.env.MYSQL_DBNAME,
            port: 3307,
            waitForConnections: true,
            connectionLimit: 4,
            queueLimit: 0
        });

        console.log(
            consoleColor(
                `MySQL pool ready! Took ${ms_convert(Date.now() - start)}`,
                "green"
            )
        );
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
            this.pool.execute('insert ignore into JikanGuildLeaderboardSettings (server_id) values (?)', [id])
            // server settings

            this.pool.execute(`create table if not exists JikanGuildLeaderboard_${id} (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)`);
            // local leaderboard for server

            this.pool.execute(`create table if not exists JikanGuildLeaderboardTemp_${id} (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)`);
            // temp 
        } catch(e) {}


        try {
            const [test_for_settings] = await connection.query('select server_id from JikanGuildLeaderboardSettings where server_id = ?', [id]);
            //console.log(test_for_settings[0].server_id == undefined);

            if (!test_for_settings[0]) {
                // no leaderboard settings

                console.log(consoleColor(`No JikanGuildLeaderboardSettings for ${id}, creating...`, "yellow"));

                await this.pool.execute('insert into JikanGuildLeaderboardSettings (server_id) values (?)', [id]);

                console.log(consoleColor(`Guild ${id} JikanGuildLeaderboardSettings entry has been created., `, "green"));
            }
            else {
                console.log(consoleColor(`JikanGuildLeaderboardSettings for ${id} already exists, continue`, "green"));
            }

            if (!await this.checkIfDBTableExists(`JikanGuildLeaderboard_${id}`)) {
                console.log(consoleColor(`Creating JikanGuildLeaderboard_${id} because it does not exist`, "yellow"));

                await this.pool.execute(`create table if not exists JikanGuildLeaderboard_${id} (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)`);
            }
            else {
                console.log(consoleColor(`JikanGuildLeaderboard_${id} already exists, continue`, "green"));
            }

            if (!await this.checkIfDBTableExists(`JikanGuildLeaderboardTemp_${id}`)) {
                // JikanGuildLeaderboardTemp_ will be removed anyways if you kick the bot
                // to prevent time exploits

                console.log(consoleColor(`Creating JikanGuildLeaderboardTemp_${id} because it does not exist`, "yellow"));

                await this.pool.execute(`create table if not exists JikanGuildLeaderboardTemp_${id} (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)`);
            }
            else {
                console.log(consoleColor(`JikanGuildLeaderboardTemp_${id} exists, continue`, "yellow"));
            }

            telemetry.log("create_server_data", "_calls");
            console.log(consoleColor(`Finished initializing server data for ${id}`, "green"));
        } catch (e) {
            telemetry.log("create_server_data", "_errors");

            throw new JikanDBError(e.message);
        }
        finally {
            if (connection) {
                connection.release();
            }
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
        telemetry.log("get_leaderboard_scope", "_calls");

        switch (type.toUpperCase()) {
            case "GLOBAL":
                return "JikanGlobalLeaderboard";
            case "LOCAL":
                return `JikanGuildLeaderboard_${guild_id}`;
            case "REALTIME":
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