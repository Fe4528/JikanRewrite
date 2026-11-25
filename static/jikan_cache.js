
/*
For anything cache related
Excluding JikanTempTime

Notes: The log channel ID is only there to show what channel
the admin has set for sending VC join/leave logs.
*/

class JikanCache {
    static #banlist_cache = new Set();

    static #server_ignoredrole_cache = new Map();
    static #server_lb_name_cache = new Map();
    static #server_locale_cache = new Map();
    static #server_logchannel_cache = new Map();

    static #server_webhook_url_cache = new Map();
    static #server_webhook_cache = new Map();

    /**
     * Add ID to ban list cache
     * @param {string} id
     */
    static addBanID(id) {
        this.#banlist_cache.add(id);
    }

    /**
     * Set or overwrite log channel cache
     * @param {string} id
     * @param {string} channel
     */
    static addOrSetServerLogChannelCache(id, channel) {
        this.#server_logchannel_cache.set(id, channel);
    }

    /**
     * Set or overwrite ignored role cache
     * @param {string} id
     * @param {string} role_id
     */
    static addOrSetServerIgnoredRoleCache(id, role_id) {
        this.#server_ignoredrole_cache.set(id, role_id);
    }

    /**
     * Set or overwrite server leaderboard name cache
     * @param {string} id
     * @param {string} str
     */
    static addOrSetServerLBNameCache(id, str) {
        this.#server_lb_name_cache.set(id, str);
    }

    /**
     * Set or overwrite server locale cache
     * @param {string} id
     * @param {string} locale
     */
    static addOrSetServerLangCache(id, locale) {
        this.#server_locale_cache.set(id, locale);
    }

    /**
     * Set or overwrite webhook object cache
     * @param {string} id
     * @param {import('discord.js').WebhookClient} webhook
     */
    static addOrSetServerWebhookObject(id, webhook) {
        this.#server_webhook_cache.set(id, webhook);
    }

    /**
     * Set or overwrite webhook URL cache
     * Invalidates the cached WebhookClient when the URL changes
     * @param {string} id
     * @param {string} url
     */
    static addOrSetServerWebhookURL(id, url) {
        this.#server_webhook_url_cache.set(id, url);
        this.#server_webhook_cache.delete(id);
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
     * Get the server ignored role ID in cache
     * @param {string} id
     * @returns {string | undefined}
     */
    static getServerIgnoredRoleCache(id) {
        return this.#server_ignoredrole_cache.get(id);
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
     * Get the server locale in cache
     * @param {string} id
     * @returns {string | undefined}
     */
    static getServerLangCache(id) {
        return this.#server_locale_cache.get(id);
    }

    /**
     * Get the cached WebhookClient
     * @param {string} id
     * @returns {import('discord.js').WebhookClient | undefined}
     */
    static getServerWebhookObject(id) {
        return this.#server_webhook_cache.get(id);
    }

    /**
     * Get the webhook URL in cache
     * @param {string} id
     * @returns {string | undefined}
     */
    static getServerWebhookURL(id) {
        return this.#server_webhook_url_cache.get(id);
    }

    /**
     * Check if guild has any cached configuration
     * @param {string} id
     * @returns {boolean}
     */
    static hasGuild(id) {
        return (
            this.#server_ignoredrole_cache.has(id) ||
            this.#server_lb_name_cache.has(id) ||
            this.#server_locale_cache.has(id) ||
            this.#server_logchannel_cache.has(id) ||
            this.#server_webhook_url_cache.has(id) ||
            this.#server_webhook_cache.has(id)
        );
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
     * Remove ID from ban list cache
     * @param {string} id
     */
    static removeBanID(id) {
        this.#banlist_cache.delete(id);
    }

    /**
     * Remove all cached configuration entries for a guild
     * @param {string} id
     */
    static removeGuildConfigCache(id) {
        this.#server_ignoredrole_cache.delete(id);
        this.#server_lb_name_cache.delete(id);
        this.#server_locale_cache.delete(id);
        this.#server_logchannel_cache.delete(id);
        this.#server_webhook_url_cache.delete(id);
        this.#server_webhook_cache.delete(id);
    }

    /**
     * Remove the log channel cache
     * @param {string} id
     */
    static removeServerLogChannelCache(id) {
        this.#server_logchannel_cache.delete(id);
    }

    /**
     * Remove the server ignored role cache
     * @param {string} id
     */
    static removeServerIgnoredRoleCache(id) {
        this.#server_ignoredrole_cache.delete(id);
    }

    /**
     * Remove the server leaderboard name cache
     * @param {string} id
     */
    static removeServerLBNameCache(id) {
        this.#server_lb_name_cache.delete(id);
    }

    /**
     * Remove the server locale cache
     * @param {string} id
     */
    static removeServerLangeCache(id) {
        this.#server_locale_cache.delete(id);
    }

    /**
     * Remove the cached WebhookClient
     * @param {string} id
     */
    static removeServerWebhookObject(id) {
        this.#server_webhook_cache.delete(id);
    }

    /**
     * Remove the webhook URL and its cached WebhookClient
     * @param {string} id
     */
    static removeServerWebhookURL(id) {
        this.#server_webhook_url_cache.delete(id);
        this.#server_webhook_cache.delete(id);
    }

    /**
     * Replace ban list cache with an iterable of IDs
     * @param {Iterable<string>} ids
     */
    static setBanListCache(ids = []) {
        this.#banlist_cache = new Set(ids);
    }

    /**
     * Set or overwrite all cached guild settings or a specific one.
     *
     * @param {string} id
     * @param {{
     *   ignored_role?: string | null,
     *   lb_name?: string | null,
     *   locale?: string | null,
     *   log_channel?: string | null,
     *   webhook_url?: string | null,
     *   webhook_object?: import('discord.js').WebhookClient | null
     * }} s
     */
    static setGuildSettings(id, s = {}) {
        if (Object.hasOwn(s, 'ignored_role')) {
            if (s.ignored_role === null) {
                this.#server_ignoredrole_cache.delete(id);
            } else if (s.ignored_role !== undefined) {
                this.#server_ignoredrole_cache.set(id, s.ignored_role);
            }
        }

        if (Object.hasOwn(s, 'lb_name')) {
            if (s.lb_name === null) {
                this.#server_lb_name_cache.delete(id);
            } else if (s.lb_name !== undefined) {
                this.#server_lb_name_cache.set(id, s.lb_name);
            }
        }

        if (Object.hasOwn(s, 'locale')) {
            if (s.locale === null) {
                this.#server_locale_cache.delete(id);
            } else if (s.locale !== undefined) {
                this.#server_locale_cache.set(id, s.locale);
            }
        }

        if (Object.hasOwn(s, 'log_channel')) {
            if (s.log_channel === null) {
                this.#server_logchannel_cache.delete(id);
            } else if (s.log_channel !== undefined) {
                this.#server_logchannel_cache.set(id, s.log_channel);
            }
        }

        if (Object.hasOwn(s, 'webhook_url')) {
            if (s.webhook_url === null) {
                this.#server_webhook_url_cache.delete(id);
                this.#server_webhook_cache.delete(id);
            } else if (s.webhook_url !== undefined) {
                this.#server_webhook_url_cache.set(id, s.webhook_url);

                if (!Object.hasOwn(s, 'webhook_object')) {
                    this.#server_webhook_cache.delete(id);
                }
            }
        }

        if (Object.hasOwn(s, 'webhook_object')) {
            if (s.webhook_object === null) {
                this.#server_webhook_cache.delete(id);
            } else if (s.webhook_object !== undefined) {
                this.#server_webhook_cache.set(id, s.webhook_object);
            }
        }
    }
}

module.exports = JikanCache;