const mysql = require('mysql2/promise');
const { JikanDBError } = require('./utils.js');

class MySQLDatabase {
    constructor() {
        (async () => {
            this.connection = await mysql.createPool({
                host: process.env.MYSQL_ENDPOINT,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DBNAME,
                waitForConnections: true,
                connectionLimit: 5,
                queueLimit: 0,
                port: 3307
            });
        })();
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
                return `JikanGuildLeaderboard_${id}`;
            case "TEMP":
                return `JikanGuildLeaderboardTemp_${id}`;
            default:
                throw new JikanDBError("Invalid scope.");
        }
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

            const [res] = await connection.query(`select * from ${tableName} where user_id = ?`, [params.id]);

            return res.length > 0 ? res[0] : new JikanDBError(`User with ID: ${params.id} is not found.\nDB_SCOPE is ${params.type}.\nRequested from ${params.guild_id}`);
        } catch (e) {
            return new JikanDBError(e)
        } finally {
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

            return row;
        } catch (e) {
            return new JikanDBError(e);
        } finally {
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
        // Just assume that all user created are in this table
        let connection;

        try {
            connection = await this.connection.getConnection();

            const [res] = await connection.query('select user_id from JikanUser where user_id = (?)', user_id);

            if (res.length > 0) return true;
            return false;
        } catch (e) {
            return new JikanDBError(e);
        } finally {
            if (connection) {
                connection.release();
            }
        }

    }

    async userExistsInLeaderboard(lb_scope, id) {
        let connection;

        try {
            connection = await this.connection.getConnection();

            const [res] = await connection.query(`select user_id from ${lb_scope} where user_id = (?)`, [id]);

            if (res.length < 1) return false;
            return true;
        } catch (e) {
            return new JikanDBError(e);
        } finally {
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
        let tableName = this.getLeaderboardScope(params.type, params.guild_id);

        try {
            connection = await this.connection.getConnection();

            const exists = await this.userExistsInLeaderboard(tableName, params.id)

            if (exists) {
                // means they exist in this leaderboard
                // so just update or set it
                //
                // take note that we should also update
                // the username just in case they change it
                //
                // no need to change ID as it can't be changed
                // by the user
                console.log("User %s, start update local and temp...", params.id);

                if (params.mode == "UPDATE") {
                    await connection.execute(`update ${tableName} set vc_time = vc_time + (?), user_name = (?) where user_id = (?)`, [params.current_time, params.user_name, params.id]);
                } else if (params.mode == "SET") {
                    await connection.execute(`update ${tableName} set vc_time = (?), user_name = (?) where user_id = (?)`, [params.current_time, params.user_name, params.id]);
                } else {
                    return new JikanDBError(`Unsupported mode: ${params.mode}`);
                }
            } else {
                // create entries in order: jikanuser, jikan global db, jikan guild db, temp
                console.log("User %s does not exist. creating entries...", params.id)

                await connection.execute(`insert ignore into JikanUser (user_id, user_name, is_hidden) values (?, ?, ?)`, [params.id, params.user_name, 0]);
                // user

                await connection.execute(`insert ignore into JikanGlobalLeaderboard (user_id, user_name, vc_time) values (?, ?, ?)`, [params.id, params.user_name, 0]);
                // global lb

                await connection.execute(`insert ignore into JikanGuildLeaderboard_${params.guild_id} (user_id, user_name, vc_time) values (?, ?, ?)`, [params.id, params.user_name, 0]);
                // guild lb (local)

                await connection.execute(`insert ignore into JikanGuildLeaderboardTemp_${params.guild_id} (user_id, user_name, vc_time) values (?, ?, ?)`, [params.id, params.user_name, Date.now()]);
                // temp lb
            }
        } catch (e) {
            return new JikanDBError("Fatal error at updateUserTime()");
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }

    /**
     * Get all user vc time in milliseconds
     * @param {string} user_id
     * @param {string} guild_id  
     */
    async getAllUserTime(user_id, guild_id) {
        let connection;

        try {
            connection = await this.connection.getConnection();

            const [res] = await connection.query(`select userdb.user_id, local.vc_time as local_time, global.vc_time as global_time, temp.vc_time as temp_time from JikanUser as userdb left join JikanGlobalLeaderboard as global on userdb.user_id = global.user_id left join JikanGuildLeaderboard_${guild_id} as local on global.user_id = local.user_id left join JikanGuildLeaderboardTemp_${guild_id} as temp on global.user_id = temp.user_id where userdb.user_id = (?)`, [user_id]);

            return res[0];
        } catch (e) {
            return new JikanDBError(e);
        } finally {
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
    async getTempTimeAndLocal(user_id, guild_id) {
        let connection;

        try {
            connection = await this.connection.getConnection();

            const [res] = await connection.query(`select userdb.user_id, local.vc_time as local_time, temp.vc_time as temp_time from JikanUser as userdb left join JikanGuildLeaderboard_${guild_id} as local on userdb.user_id = local.user_id left join JikanGuildLeaderboardTemp_${guild_id} as temp on local.user_id = temp.user_id where userdb.user_id = (?)`, [user_id]);

            return res[0];
        } catch (e) {
            return new JikanDBError(e);
        } finally {
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

            if (!await connection.query('select server_id from JikanGuildLeaderboardSettings where server_id = ?', [id])[0]) {
                // no leaderboard settings

                console.log("No JikanGuildLeaderboardSettings for %s, creating...", id);
                await connection.execute('insert into JikanGuildLeaderboardSettings (server_id) values (?)', [id]);
            }

            console.log("Creating JikanGuildLeaderboard_%s", id);
            await connection.execute(`create table JikanGuildLeaderboard_${id} (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)`);

            // it will be nonexistent anyways if you kick the bot
            // to prevent time exploits
            //
            // if statement just in case
            console.log("Creating JikanGuildLeaderboardTemp_%s", id);
            await connection.execute(`create table JikanGuildLeaderboardTemp_${id} (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)`);

        } catch (e) {
            return new JikanDBError(e);
        } finally {
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

            const [res] = await connection.query(`show tables like ?`, [table_name]);

            return res[0];
        } catch (e) {
            return new JikanDBError(e);
        } finally {
            if (connection) {
                connection.release();
            }
        }

    }

    /**
     * Check if all db is valid
     */
    async checkGuildDBAvailability(id) {
        const local_lb_exists = await this.checkIfDBTableExists(`JikanGuildLeaderboard_${id}`);
        const temp_lb_exists = await this.checkIfDBTableExists(`JikanGuildLeaderboardTemp_${id}`)

        if (local_lb_exists && temp_lb_exists) {
            return true
        }
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

            const [res] = await connection.query(`select * from ${scope} order by ${value} ${order}`);

            return res;
        } catch (e) {
            return new JikanDBError(e);
        } finally {
            if (connection) {
                connection.release();
            }
        }
    }
}

module.exports = MySQLDatabase;