const mysql = require('mysql2/promise');
const { JikanDBError, consoleColor, ms_convert } = require('./utils.js');
const telemetry = require("./telemetry.js");

class JikanMySQLDatabase {
    constructor() {
        console.log(consoleColor("Trying to connect to MySQL server", 'yellow'));
        const time_old = Date.now();

        this.connection = mysql.createPool({
            host: process.env.MYSQL_ENDPOINT,
            user : process.env.MYSQL_USER,
            password : process.env.MYSQL_PASSWORD,
            database : process.env.MYSQL_DBNAME,
            waitForConnections : true,
            connectionLimit : 4,
            queueLimit : 0,
            port : 3307
            });

        const time_new = Date.now();
        console.log(consoleColor(`A connection has been made!Took ${ ms_convert(time_new - time_old) }`, "green"));
    }
    /*
    keepAlive() {
        let count = 1;

        setInterval(() => {
            //this.connection.execute("insert into `JikanGlobalLeaderboard` (user_id, user_name, vc_time) values (?, ?, ?)",["FUCK", "THIS", 1832748937412]);
            this.connection.execute("select 1=1");
            console.log("PING %s", count);
            count++;
        }, 3000)
        // idk why but the provided mysql server keeps locking me tf out if the app is idle for a minute
        // update: ignore this
    }
    */

    // TYPES OF SCOPE:
    //
    // GLOBAL
    // LOCAL
    // TEMP

    /**
    * Get database scope string for use in query
    * @param {string} type - Type of database
    * @param {string} id - guild id
    * @returns scope of database
    */
    getLeaderboardScope(type, id) {
        switch (type) {
        case "GLOBAL":
            return `JikanGlobalLeaderboard`;
        case "LOCAL":
            return `JikanGuildLeaderboard_${id
        }`;
            case "TEMP":
                return `JikanGuildLeaderboardTemp_${id
    }`;
            default:
                throw new JikanDBError("Invalid scope.");
}

telemetry.log("get_leaderboard_scope_calls");
    }

    /**
     * Get the user in leaderboard
     * @param {object} params
     * @returns user info or JikanDBError
     */
    async getUser(params) {
        let tableName = this.getLeaderboardScope(params.type, params.guild_id);
        let connection;

        try {
            connection = await this.connection.getConnection();

            const [res] = await connection.query(`select * from ${ tableName } where user_id = ? `,[params.id]);

            telemetry.log("get_user_calls");

            return res.length > 0 ? res[0] : new JikanDBError(`User with ID : ${ params.id } is not found.\nDB_SCOPE is ${ params.type }.\nRequested from ${ params.guild_id }`);
        }
        catch (e) {
            telemetry.log("get_user_errors");

            throw new JikanDBError(e.message)
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Get table names
     * @returns array of strings
     */
    async getTableNames() {
        let connection;

        try {
            connection = await this.connection.getConnection();

            const [row] = await connection.query('select table_name from information_schema.tables where table_schema = (?)', [process.env.MYSQL_DBNAME]);

            telemetry.log("get_table_names_calls");

            return row;
        }
        catch (e) {
            telemetry.log("get_table_names_errors");

            throw new JikanDBError(e.message);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Check if user with the given ID exists in the database
     * @param {string} user_id
     * @returns true or false
     */
    async userExists(user_id) {

        let connection;

        try {
            connection = await this.connection.getConnection();

            // Just assume that all user created are in this table
            const [res] = await connection.query('select user_id from JikanUser where user_id = (?)', user_id);

            telemetry.log("user_exists_calls");

            if (res.length > 0) return true;
            return false;
        }
        catch (e) {
            telemetry.log("user_exists_errors");

            throw new JikanDBError(e.message);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }

    async userExistsInLeaderboard(lb_scope, user_id, guild_id) {
        let connection;

        try {
            connection = await this.connection.getConnection();

            const target = this.getLeaderboardScope(lb_scope, guild_id);
            const [res] = await connection.query(`select user_id from ${ target } where user_id = (? )`,[user_id]);

            telemetry.log("user_exists_in_leaderboard_calls");

            if (res.length < 1) return false;
            return true;
        }
        catch (e) {
            telemetry.log("user_exists_in_leaderboard_errors");

            throw new JikanDBError(e.message);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Updates VC Time for a user
     * @param {object} params
     */
    async updateUserTime(params) {
        // updates time
        //
        // params content:
        // id: user id
        // guild_id: guild id
        // type: GLOBAL, LOCAL, TEMP
        // current_time: either current time or their new (vc time - current_time)
        // mode: UPDATE, SET
        let connection;

        try {
            connection = await this.connection.getConnection();

            const exists = await this.userExistsInLeaderboard(params.type, params.id, params.guild_id)

                if (exists) {
                    // means they exist in this leaderboard
                    // so just update or set it
                    //
                    // take note that we should also update
                    // the username just in case they change it
                    //
                    // no need to change ID as it can't be changed
                    // by the user

                    let tableName = this.getLeaderboardScope(params.type, params.guild_id);

                    console.log(consoleColor(`User ${ params.id } exists on table : ${ tableName }`, "green"));
                    console.log(consoleColor(`User ${ params.id }, start ${ params.mode } ${ params.type }`, "green"));

                    if (params.mode == "UPDATE") {
                        await connection.execute(`update ${ tableName } set vc_time = vc_time + (? ), user_name = (? ) where user_id = (? )`,[params.current_time, params.user_name, params.id]);
                    }
                    else if (params.mode == "SET") {
                        await connection.execute(`update ${ tableName } set vc_time = (? ), user_name = (? ) where user_id = (? )`,[params.current_time, params.user_name, params.id]);
                    }
                    else if (params.mode == "DELETE") {
                        await connection.execute(`delete from ${ tableName } where user_id = (? )`,[params.id]);
                    }
                    else {
                        return new JikanDBError(`Unsupported mode: ${ params.mode }`);
                    }
                }
                else {
                    // create entries in order: jikanuser, jikan global db, jikan guild db, temp
                    console.log(consoleColor(`User ${ params.id } does not exist / just entered vc.creating entries...`, "red"));

                    //console.log("\nCheck parameters if null:\nid (user id): \t%s\nuser_name: \t%s\nguild_id: \t%s\n", params.id, params.user_name, params.guild_id);

                    if (!params.id || !params.user_name || !params.guild_id || !params.current_time) {
                        console.log(consoleColor(`One or more value is invalid, skipping updateUserTime() operation`, "red"));
                        return;
                    }

                    await connection.execute(`insert ignore into JikanUser(user_id, user_name, is_hidden) values(? , ? , ? )`,[params.id, params.user_name, 0]);
                    // user

                    await connection.execute(`insert ignore into JikanGlobalLeaderboard(user_id, user_name, vc_time) values(? , ? , ? )`,[params.id, params.user_name, 0]);
                    // global leaderboard

                    await connection.execute(`insert ignore into JikanGuildLeaderboard_${ params.guild_id } (user_id, user_name, vc_time) values(? , ? , ? )`,[params.id, params.user_name, 0]);
                    // guild leaderboard (local)

                    await connection.execute(`insert ignore into JikanGuildLeaderboardTemp_${ params.guild_id } (user_id, user_name, vc_time) values(? , ? , ? )`,[params.id, params.user_name, Date.now()]);
                    // temp leaderboard
                }

            telemetry.log("update_user_time_calls");
        }
        catch (e) {
            telemetry.log("update_user_time_errors");

            throw new JikanDBError(e.message);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Get temp time and local time from a user
     * @param {string} user_id
     * @param {string} guild_id
     * @returns
     */
    async getUserTimeFrom(user_id, guild_id, scope) {
        let connection;

        try {
            connection = await this.connection.getConnection();

            const target = this.getLeaderboardScope(scope, guild_id);
            //console.log(target);
            const [res] = await connection.query(`select * from ${ target } where user_id = (? )`,[user_id]);

            telemetry.log("get_user_time_from_calls");
            return res[0];
        }
        catch (e) {
            telemetry.log("get_user_time_from_errors");

            throw new JikanDBError(e.message);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Create server data
     * @param {string} id The server ID
     */
    async createServerData(id) {
        let connection;
        // in testing, this should remove the datas because i will
        // simulate an "on join" event so i don't have to
        // kick the bot and join multiple times

        // make data
        // not sure if i need to use await here...
        // but we're not waiting for any data so
        // it should be good
        try {
            connection = await this.connection.getConnection();
            const [test_for_settings] = await connection.query('select server_id from JikanGuildLeaderboardSettings where server_id = ?', [id]);
            //console.log(test_for_settings[0].server_id == undefined);

            if (!test_for_settings[0]) {
                // no leaderboard settings

                console.log(consoleColor(`No JikanGuildLeaderboardSettings for ${ id }, creating...`, "yellow"));

                await connection.execute('insert into JikanGuildLeaderboardSettings (server_id) values (?)', [id]);

                console.log(consoleColor(`Guild ${ id } JikanGuildLeaderboardSettings entry has been created., `, "green"));
            }
            else {
                console.log(consoleColor(`JikanGuildLeaderboardSettings for ${ id } already exists, continue`, "green"));
            }

            if (!await this.checkIfDBTableExists(`JikanGuildLeaderboard_${id
        }`)) {
                console.log(consoleColor(`Creating JikanGuildLeaderboard_${ id } because it does not exist`, "yellow"));

                await connection.execute(`create table if not exists JikanGuildLeaderboard_${ id } (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)`);
            }
            else {
                console.log(consoleColor(`JikanGuildLeaderboard_${id} already exists, continue`, "green"));
            }
    }

    if (!await this.checkIfDBTableExists(`JikanGuildLeaderboardTemp_${id}`)) {
        // JikanGuildLeaderboardTemp_ will be removed anyways if you kick the bot
        // to prevent time exploits

        console.log(consoleColor(`Creating JikanGuildLeaderboardTemp_${ id } because it does not exist`, "yellow"));

        await connection.execute(`create table if not exists JikanGuildLeaderboardTemp_${ id } (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)`);
    }
 else {
     console.log(consoleColor(`JikanGuildLeaderboardTemp_${id
} exists, continue`, "yellow"));
            }

            telemetry.log("create_server_data_calls");
            console.log(consoleColor(`Finished initializing server data for ${ id }`, "green"));
        }
        catch (e) {
            telemetry.log("create_server_data_errors");

            throw new JikanDBError(e.message);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Check if table exists (internal use only i think)
     * @param {string} table_name
     */
    async checkIfDBTableExists(table_name) {
        let connection;

        try {
            connection = await this.connection.getConnection();

            const [res] = await connection.query(`show tables like ? `,[table_name]);

            telemetry.log("check_if_db_table_exists_calls");
            return res[0];
        }
        catch (e) {
            telemetry.log("check_if_db_table_exists_errors");

            throw new JikanDBError(e.message);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Check if all db is valid
     */
    async checkGuildDBAvailability(id) {
        const local_lb_exists = await this.checkIfDBTableExists(`JikanGuildLeaderboard_${id
    }`);
    const temp_lb_exists = await this.checkIfDBTableExists(`JikanGuildLeaderboardTemp_${id}`)

    telemetry.log("check_guild_db_availability_calls");

    if (local_lb_exists && temp_lb_exists) {
        return true
    }

    return false
    }

    /**
     * Get leaderboard from type
     * @param {string} type
     * @param {string} guild_id
     * @param {string} what_to_order - the column to order by
     * @param {string} order - "asc" or "desc"
     * @returns {Array} Array of users in leaderboard
     */
    async getLeaderboardFrom(type, guild_id = null, value = "vc_time", order = "desc") {
        let connection;

        try {
            connection = await this.connection.getConnection();

            const scope = this.getLeaderboardScope(type, guild_id);

            const [res] = await connection.query(`select * from ${ scope } order by ${ value } ${ order }`);

            telemetry.log("get_leaderboard_from_calls");

            return res;


        }
        catch (e) {
            telemetry.log("get_leaderboard_from_errors");

            throw new JikanDBError(e.message);
        }
        finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = JikanMySQLDatabase;