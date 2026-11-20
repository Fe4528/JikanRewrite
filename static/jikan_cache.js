/*
For anything cache related
Excluding JikanTempTime


Notes: The log channel ID is only there to show what channel
the admin has set for sending vc join/leave logs
*/

class JikanCache {
    static #banlist_cache = new Set();
    static #server_ignoredrole_cache = new Map();
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
     * Remove ID from ban list cache
     * @param {string} id
     */
    static removeBanID(id) {
        this.#banlist_cache.delete(id);
    }

    /**
     * Replace ban list cache with an iterable of IDs
     * @param {Iterable<string>} ids
     */
    static setBanListCache(ids = []) {
        this.#banlist_cache = new Set(ids);
    }

    /**
     * Check if ID exists in ban list cache
     * @param {string} id
     * @returns {boolean}
     */
    static isBanIDExist(id) {
        return this.#banlist_cache.has(id);
    }

    /**
     * Set the ignored role cache for a guild
     * @param {string} id
     * @param {string} role_id
     */
    static addOrSetServerIgnoredRoleCache(id, role_id) {
        this.#server_ignoredrole_cache.set(id, role_id);
    }

    /**
     * Get the ignored role ID in cache for a guild
     * @param {string} id
     * @returns {string | undefined}
     */
    static getServerIgnoredRoleCache(id) {
        return this.#server_ignoredrole_cache.get(id);
    }

    /**
     * Remove the ignored role cache for a guild
     * @param {string} id
     */
    static removeServerIgnoredRoleCache(id) {
        this.#server_ignoredrole_cache.delete(id);
    }

    /**
     * Set the log channel cache
     * @param {string} id
     * @param {string} channel
     */
    static addOrSetLogChannelCache(id, channel) {
        this.#server_logchannel_cache.set(id, channel);
    }

    /**
     * Get the log channel ID in cache
     * @param {string} id
     * @returns {string | undefined}
     */
    static getServerLogChannelCache(id) {
        return this.#server_logchannel_cache.get(id);
    }

    /**
     * Remove the log channel cache
     * @param {string} id
     */
    static removeServerLogChannelCache(id) {
        this.#server_logchannel_cache.delete(id);
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
     * Get the server leaderboard name in cache
     * @param {string} id
     * @returns {string | undefined}
     */
    static getServerLBNameCache(id) {
        return this.#server_lb_name_cache.get(id);
    }

    /**
     * Remove the server leaderboard name cache
     * @param {string} id
     */
    static removeServerLBNameCache(id) {
        this.#server_lb_name_cache.delete(id);
    }

    /**
     * Add or set a server language cache
     * @param {string} id
     * @param {string} locale
     */
    static addOrSetServerLangCache(id, locale) {
        this.#server_locale_cache.set(id, locale);
    }

    /**
     * Get the server language in cache
     * @param {string} id
     * @returns {string | undefined}
     */
    static getServerLangCache(id) {
        return this.#server_locale_cache.get(id);
    }

    /**
     * Remove the server language cache
     * @param {string} id
     */
    static removeServerLangCache(id) {
        this.#server_locale_cache.delete(id);
    }

    /**
     * Check if guild exists in cache
     * @param {string} id
     * @returns {boolean}
     */
    static hasGuild(id) {
        return (
            this.#server_locale_cache.has(id) ||
            this.#server_lb_name_cache.has(id) ||
            this.#server_ignoredrole_cache.has(id) ||
            this.#server_logchannel_cache.has(id)
        );
    }

    /**
     * Remove all cached config entries for a guild
     * @param {string} id
     */
    static removeGuildConfigCache(id) {
        this.#server_ignoredrole_cache.delete(id);
        this.#server_lb_name_cache.delete(id);
        this.#server_locale_cache.delete(id);
        this.#server_logchannel_cache.delete(id);
    }

    /**
     * Set or overwrite cached guild settings
     * @param {string} id
     * @param {{ ignored_role?: string | null, lb_name?: string | null, locale?: string | null, log_channel?: string | null }} s
     */
    static setGuildSettings(id, s = {}) {
        if (s.ignored_role != null) {
            this.#server_ignoredrole_cache.set(id, s.ignored_role);
        } else {
            this.#server_ignoredrole_cache.delete(id);
        }

        if (s.lb_name != null) {
            this.#server_lb_name_cache.set(id, s.lb_name);
        } else {
            this.#server_lb_name_cache.delete(id);
        }

        if (s.locale != null) {
            this.#server_locale_cache.set(id, s.locale);
        } else {
            this.#server_locale_cache.delete(id);
        }

        if (s.log_channel != null) {
            this.#server_logchannel_cache.set(id, s.log_channel);
        } else {
            this.#server_logchannel_cache.delete(id);
        }
    }
}

module.exports = JikanCache;