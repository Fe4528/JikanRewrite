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

    async getUser(params) {
        let res;
        let tableName;

        switch(params.scope) {
            case "GLOBAL":
                tableName = "JikanGlobalLeaderboard";
                break;
            case "LOCAL":
                tableName = "JikanGuildLeaderboard_" + params.guild_id;
                break;
            case "TEMP":
                tableName = "JikanGuildLeaderboardTemp_" + params.guild_id;
            default:
                return new JikanDBError("Invalid scope.");
        }
        
        res = await this.connection.query('select * from `'+ tableName +'` where `user_id` = (?)', [params.id]);
        
        return res[0].length > 0 ? res[0] : new JikanDBError(`User with ID: ${params.id} is not found.\nDB_SCOPE is ${params.scope}.\nRequested from ${params.guild_id}`);
    }

    async getTableNames() {
        const [row, fields] = await this.connection.query('select table_name from information_schema.tables where table_schema = \'s26417_NewDB\'');

        return row;
    }

    async createUser(params) {
        if (this.getUser(params.id)) {
            throw new JikanDBError('This user exists already');
        }
    }

    async updateUserTime(params) {
        switch(params.scope) {
            case
        }

        await this.connection.execute('')
    }
}

module.exports = MySQLDatabase;