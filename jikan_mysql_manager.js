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
            })
        })();
    }

    // TYPES OF SCOPE:
    //
    // GLOBAL
    // LOCAL
    // TEMP

    async getUser(parameter) {
        let res;
        let tableName;

        switch(parameter.scope) {
            case "GLOBAL":
                tableName = "JikanGlobalLeaderboard";
                break;
            case "LOCAL":
                tableName = "JikanGuildLeaderboard_" + parameter.guild_id;
                break;
            case "TEMP":
                tableName = "JikanGuildLeaderboardTemp_" + parameter.guild_id;
            default:
                return new JikanDBError("Invalid scope.");
        }
        
        res = await this.connection.query('select * from `'+ tableName +'` where `user_id` = (?)', [parameter.id]);
        
        return res[0].length > 0 ? res[0] : new JikanDBError(`User with ID: ${parameter.id} is not found.\nDB_SCOPE is ${parameter.scope}.\nRequested from ${parameter.guild_id}`);
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
}

module.exports = MySQLDatabase;