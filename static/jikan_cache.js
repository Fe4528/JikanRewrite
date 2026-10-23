/* 
For anything cache related
Excluding JikanTempTime


Notes: The log channel ID is only there to show what channel
the admin has set for sending vc join/leave logs 
*/ 

class JikanCache {
    static #banlist_cache = new Set();
    static #server_lb_name_cache = new Map();
    static #server_locale_cache = new Map();
    static #server_logchannel_cache = new Map();

    /**
     * Add ID in ban list cache
     * @param {string} id 
     */    
    static addBanID(id) {
        this.#banlist_cache.add(id);
    }

    /**
     * Set the log channel cache
     * 
     */
    static addOrSetLogChannelCache(id, channel) {
        this.#server_logchannel_cache.set(id, channel);
    }

    /**
     * Set the server leaderboard name cache
     * @param {string} id 
     * @param {string} str 
     */
    static addOrSetServerLBNameCache(id, str) {
        this.#server_lb_name_cache.set(id, str);
    }

    /**
     * Add a server language cache
     * @param {string} id 
     * @param {string} locale 
     */
    static addOrSetServerLangCache(id, locale) {
        this.#server_locale_cache.set(id, locale);
    }

    /**
     * Chekc if ID exists in ban list cache
     * @param {string} id 
     * @returns boolean
     */
    static isBanIDExist(id) {
        return this.#banlist_cache.has(id);
    }

    /**
     * Get the server leaderboard name in cache
     * @param {string} id 
     * @returns The server leaderboard name in cache
     */
    static getServerLBNameCache(id) {
        return this.#server_lb_name_cache.get(id);
    }

    /**
     * Get the server language in cache
     * @param {string} id 
     * @returns The locale of server in cache 
     */
    static getServerLangCache(id) {
        return this.#server_locale_cache.get(id);
    }

    static getServerLogChannelCache(id) {
        return this.#server_logchannel_cache.get(id);
    }

    static removeServerLBNameCache(id) {
        this.#server_lb_name_cache.delete(id)
    }

    static removeServerLangCache(id) {
        this.#server_locale_cache.delete(id);
    }

    static removeServerLogChannelCache(id) {
        this.#server_logchannel_cache.delete(id);
    }
}

module.exports = JikanCache;