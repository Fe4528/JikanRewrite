const mysql = require('mysql2');

class MySQLDatabase {
    constructor(connection_info) {
        this.connection = mysql.createConnection({
            host: process.env.MYSQL_ENDPOINT,
            user: process.env.MYSQL_USER,
            password: process.env.MYSQL_PASSWORD
        })
    }
}

module.exports = MySQLDatabase;