const mysql = require('mysql2/promise');
const { JikanDBError } = require('./utils.js')

class MySQLDatabase {
    constructor() { 
        (async () => { 
            this.connection = await mysql.createPool({ 
                host: process.env.MYSQL_ENDPOINT, 
                user: process.env.MYSQL_USER, 
                password: process.env.MYSQL_PASSWORD, 
                database: process.env.MYSQL_DBNAME, 
                waitForConnections: true, 
                connectionLimit: 10, 
                queueLimit: 0, 
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
    * @returns string
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
        let tableName = this.getLeaderboardScope(params.type, params.guild_id)

        const [res] = await this.connection.query(`select * from \`${tableName}\` where user_id = ?`, [params.id]);

        return res.length > 0 ? res[0] : new JikanDBError(`User with ID: ${params.id} is not found.\nDB_SCOPE is ${params.type}.\nRequested from ${params.guild_id}`);
    }

    /**
     * Get table names
     * @returns array of strings
     */
    async getTableNames() {
        const [row] = await this.connection.query('select table_name from information_schema.tables where table_schema = (?)', [process.env.MYSQL_DBNAME]);

        return row;
    }

    /**
     * Creates a user, if it doesn't exist yet
     * @param {object} params 
     */
    async createUser(params) {
        if (await this.userExists(params.id)) {
            return new JikanDBError("This user already exists.")
        }
    }

    /**
     * Check if user with the given ID exists in the database
     * @param {string} user_id 
     * @returns true or false
     */
    async userExists(user_id) {
        // Just assume that all user created are in this table
        const [res] = await this.connection.query('select user_id from `JikanUser` where user_id = (?)', user_id);

        if (res.length > 0) return true;
        return false;
    }

    async userExistsInLeaderboard(lb_scope, id) {
        const [res] = await this.connection.query(`select user_id from \`${lb_scope}\` where user_id = (?)`, [id]);

        if (res.length < 1) return false;
        return true;
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

        let tableName = this.getLeaderboardScope(params.type, params.guild_id);

        try {
            const exists = await this.userExistsInLeaderboard(tableName, params.id)

            if (exists) {
                // means they exist in this leaderboard
                // so just update or set it
                if (params.mode == "UPDATE") {
                    await this.connection.execute(`update \`${tableName}\` set vc_time = vc_time + (?) where user_id = (?)`, [params.current_time, params.id]);
                } else if (params.mode == "SET") {
                    await this.connection.execute(`update \`${tableName}\` set vc_time = (?) where user_id = (?)`, [params.current_time, params.id]);
                } else {
                    return new JikanDBError("Bro what kinda mode is that");
                }
            } else {
                // create entries in order: jikanuser, jikan global db, jikan guild db, temp
                //console.log("work")

                await this.connection.execute(`insert into \`JikanUser\` (user_id, user_name, is_hidden) values (?, ?, ?)`, [params.id, params.user_name, 0]);
                await this.connection.execute(`insert into \`JikanGlobalLeaderboard\` (user_id, user_name, vc_time) values (?, ?, ?)`, [params.id, params.user_name, 0]);
                await this.connection.execute(`insert into \`JikanGuildLeaderboard_${params.guild_id}\` (user_id, user_name, vc_time) values (?, ?, ?)`, [params.id, params.user_name, 0]);
                await this.connection.execute(`insert into \`JikanGuildLeaderboardTemp_${params.guild_id}\` (user_id, user_name, vc_time) values (?, ?, ?)`, [params.id, params.user_name, Date.now()]);
            }
        } catch (e) {
            return new JikanDBError("Fatal error at updateUserTime() 0 0 a3"); // just bullshit error code for fancy purposes
        }
    }

    /**
     * Get all user vc time in milliseconds
     * @param {string} user_id
     * @param {string} guild_id  
     */
    async getAllUserTime(user_id, guild_id) {
        const [res] = await this.connection.query(`select userdb.user_id, local.vc_time as local_time, global.vc_time as global_time, temp.vc_time as temp_time from \`JikanUser\` as userdb right join JikanGlobalLeaderboard as global on userdb.user_id = global.user_id right join \`JikanGuildLeaderboard_${guild_id}\` as local on global.user_id = local.user_id right join \`JikanGuildLeaderboardTemp_${guild_id}\` as temp on global.user_id = temp.user_id where local.user_id = (?)`, [user_id])
        return res[0];
    }

    /**
     * Get temp time and local time from a user
     * @param {string} user_id 
     * @param {string} guild_id 
     * @returns 
     */
    async getTempTimeAndLocal(user_id, guild_id) {
        const [res] = await this.connection.query(`select userdb.user_id, local.vc_time as local_time, temp.vc_time as temp_time from \`JikanUser\` as userdb right join \`JikanGuildLeaderboard_${guild_id}\` as local on userdb.user_id = local.user_id right join \`JikanGuildLeaderboardTemp_${guild_id}\` as temp on local.user_id = temp.user_id where local.user_id = (?)`, [user_id]);
        return res[0];
    }
}

module.exports = MySQLDatabase;
