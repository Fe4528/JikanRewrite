const mysql = require('mysql2/promise');
const { JikanDBError } = require('./utils.js')

class MySQLDatabase {
    constructor() {
        (async() => {
            this.connection = await mysql.createPool({
                host: process.env.MYSQL_ENDPOINT,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DBNAME,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            });
        })();

        
    }

    // TYPES OF SCOPE:
    //
    // GLOBAL
    // LOCAL
    // TEMP

    /**
    * Get database scope string for use in query
    * @param {String} type - Type of database
    * @param {String} id - guild id
    * @returns string
    */
    getLeaderboardScope(type, id) {
        switch(type) {
            case "GLOBAL":
                return "JikanGlobalLeaderboard";
            case "LOCAL":
                return "JikanGuildLeaderboard_" + id;
            case "TEMP":
                return "JikanGuildLeaderboardTemp_" + id;
            default:
                throw new JikanDBError("Invalid scope.");
        }
    }

    /**
     * Get the user in leaderboard
     * @param {Object} params 
     * @returns query or JikanDBError
     */
    async getUser(params) {
        let tableName = this.getLeaderboardScope(params.type, params.guild_id)
    
        const [res] = await this.connection.query('select * from `(?)` where `user_id` = (?)', [tableName, params.id]);
        
        return res[0].length > 0 ? res[0] : new JikanDBError(`User with ID: ${params.id} is not found.\nDB_SCOPE is ${params.scope}.\nRequested from ${params.guild_id}`);
    }

    /**
     * 
     * @returns array of strings
     */
    async getTableNames() {
        const [row, fields] = await this.connection.query('select table_name from information_schema.tables where table_schema = (?)', [process.env.MYSQL_DBNAME]);

        return row;
    }

    /**
     * Creates a user, if it doesn't exist yet
     * @param {Object} params 
     */
    async createUser(params) {
        if (this.userExists(params.id)) {
            return new JikanDBError("This user already exists.")
        }
    }

    /**
     * Check if user with the given ID exists in the database
     * @param {String} user_id 
     * @returns true or false
     */
    async userExists(user_id) {
        // Just assume that all user created are in this table
        const [res] = await this.connection.execute('select user_id from `JikanUser` where user_id = (?)', user_id);

        if (res.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    /**
     * Updates VC Time for a user
     * @param {Object} params
     */
    async updateUserTime(params) {
        // updates time
        //
        // params content:
        // id: user id
        // guild_id: guild id
        // scope: GLOBAL, LOCAL, TEMP

        let tableName = this.getDatabaseScope(params.scope);
        const [res] = await this.connection.execute('select user_id from `(?)` where user_id = (?)', [tableName, params.id]);
    }
}

module.exports = MySQLDatabase;