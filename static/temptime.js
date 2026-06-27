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
     * Get the temp time Map of a server. If not found,
     * it will create a server entry.
     * @param {string} server_id 
     * @returns {Map<server_id, object>} The server Map
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
     * @param {object} params 
     * @param {string} params.guild_id The guild ID
     * @param {string} params.user_id The user ID
     * @param {string} params.user_name The user ID 
     * @param {number} params.vc_time Value of Date.now() 
     */
    static addUserInServerTemp(params) {
        const server = this.getServer(params.guild_id)
        
        if (server.has(params.user_id)) {
            console.log(`Duplicate user on TempTime.${params.guild_id}`)
        }

        server.set(params.user_id, {
            user_id: params.user_id,
            user_name: params.user_name,
            vc_time: params.vc_time
        });
    }

    /**
     * Remove user in server temp Map
     * @param {object} params 
     * @param {string} params.guild_id The guild ID
     * @param {string} params.user_id The user ID to delete
     */
    static removeUserInServerTemp(params) {
        const user = this.getServer(params.guild_id);

        user.delete(params.user_id);
    }

    /**
     * Get sorted users from a server by their join time (oldest to newest)
     * @param {string} guild_id The guild ID
     * @param {object} param
     * @param {'vc_time' | 'user_id' | 'user_name'} param.value Value to sort
     * @param {'desc' | 'asc'} param.order Order of sorting
     * @returns {Array<object>} Sorted array of user objects
     */
    static getSortedUsers(guild_id, param) {
        const server = this.getServer(guild_id);
        
        const users_array = Array.from(server.values());

        const sorters = {
            vc_time: {
                asc:  (a, b) => a.vc_time - b.vc_time,
                desc: (a, b) => b.vc_time - a.vc_time
            },
            user_id: {
                asc:  (a, b) => a.user_id.localeCompare(b.user_id),
                desc: (a, b) => b.user_id.localeCompare(a.user_id)
            },
            user_name: {
                asc:  (a, b) => a.user_name.localeCompare(b.user_name),
                desc: (a, b) => b.user_name.localeCompare(a.user_name)
            }
        };

        return users_array.sort(sorters[param.value]?.[param.order]);
    }
}

module.exports = TempTime;
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