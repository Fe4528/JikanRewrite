class TempTime {
    static {
        this.servers = new Map()
    }

    /**
     * Add a server to the servers Map
     * @param {string} server_id
     * @returns {Map<string, object>} The server Map
     */
    static addServer(server_id) {
        const new_map = new Map()

        this.servers.set(server_id, new_map);

        return new_map;
    }

    /**
     * Get the temp time Map of a server
     * @param {string} server_id 
     * @returns {Map<string, object>} The server Map
     */
    static getServer(server_id) {
        let server = this.servers.get(server_id);

        if (!server) {
            server = this.addServer(server_id);
        }

        return server;
    }
    /**
     * Add a user in server temp
     * @param {string} params.guild_id The guild ID
     * @param {string} params.user_id The user ID
     * @param {string} params.user_name The user ID 
     * @param {number} params.joined_at Value of Date.now() 
     */
    static addUserInServerTemp(params) {
        const server = this.getServer(params.guild_id)
        
        if (server.has(params.user_id)) {
            console.log(`Duplicate user on TempTime.${params.guild_id}`)
        }

        server.set(params.user_id, {
            user_id: params.user_id,
            user_name: params.user_name,
            joined_at: params.joined_at
        })
    }
}

/*
servers: {
    server_1: {
        695154895036088384: {
            user_id: "695154895036088384",
            username: "fe4528", (when needed i guess bro jajaja)
            joined_at: Date.now()
        }
    }
}
*/