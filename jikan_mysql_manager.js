const mysql = require('mysql2/promise');

class MySQLDatabase {
    constructor() {
        (async() => {
            this.connection = await mysql.createConnection({
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
    
    async getUser(parameter) {
        const [row, field] = await this.connection.query('select * from `JikanUsers` where `user_id` = (?)', [parameter]);

        return row.length > 0 ? row[0] : null;
    }

    async getTableNames() {
        const [row, fields] = await this.connection.query('select table_name from information_schema.tables where table_schema = \'s26417_NewDB\'');

        return row;
    }

    async createUser(params) {
        if (this.getUser(params.id)) {
            return "Already exists"
        }
    }
}

module.exports = MySQLDatabase;