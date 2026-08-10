const { loadEnvFile } = require('node:process');
loadEnvFile('.env');

//
process.env.NOVC = process.argv.includes("--novc") ? "true" : "false";
//

const { REST, Routes } = require('discord.js');
const discord = require('discord.js')
// i have no idea why i did this

const rest = new REST({version: '10'}).setToken(process.env.BOT_TOKEN);


const JikanMySQLDatabase = require('#jikan/jikan_mysql_manager.js');
const JikanTempTime = require('#jikan/jikan_temptime.js');
const JikanCache = require('#jikan/jikan_cache.js')

const { JikanDBError, consoleColor, getLocaleTranslation, code_block } = require('#jikan/utils.js')
const voice_update_module = require('#jikan_events/voice_update.js');
const refresh_modules = require('#refresh_modules');

const path = require('path');
const fs = require('fs')

const commands_map = new Map();
const buttons_map = new Map();
const modals_map = new Map();
const dev_commands_map = new Map();

const commands_array = [];
const dev_commands_array = [];
// these arrays are for updating the slash command
// that happens in clientReady event of client

const command_files = fs.readdirSync('./commands/public/').filter(file => file.endsWith('.js'));
const dev_command_files = fs.readdirSync('./commands/dev/').filter(file => file.endsWith('.js'));
const button_files = fs.readdirSync('./events/buttons/').filter(file => file.endsWith('.js'));
const modal_files = fs.readdirSync('./events/modals/').filter(file => file.endsWith('.js'));

for (let file of dev_command_files) {
    const command = require(`./commands/dev/${file}`);
    if (command.data) {
        dev_commands_map.set(command.data.name, path.resolve(__dirname, 'commands', 'dev', file));
        dev_commands_array.push(command.data.toJSON());
    }
}

for (let file of command_files) {
    const command = require(`./commands/public/${file}`);
    if (command.data) {
        commands_map.set(command.data.name, path.resolve(__dirname, 'commands', 'public', file));
        commands_array.push(command.data.toJSON())
    }
}

for (let file of button_files) {
    const button = require(`./events/buttons/${file}`);
    if (button.custom_id) {
        buttons_map.set(button.custom_id, path.resolve(__dirname, 'events', 'buttons', file));
    }
}

for (let file of modal_files) {
    const modal = require(`./events/modals/${file}`);
    if (modal.custom_id) {
        modals_map.set(modal.custom_id, path.resolve(__dirname, 'events', 'modals', file));
    }
}

const client = new discord.Client({
    intents: ['Guilds', "GuildVoiceStates"]
});

client.on('interactionCreate', async interaction => {
    const is_dev = dev_commands_map.has(interaction.commandName);
    let lang_cache = JikanCache.getServerLangCache(interaction.guildId);

    if (JikanCache.isBanIDExist(interaction.user.id) || JikanCache.isBanIDExist(interaction.guildId)) {
        await interaction.reply(getLocaleTranslation(interaction.locale, 'system.banned_message'));
        return;
    }

    if (!lang_cache) {
        const lang_db = await JikanMySQLDatabase.getServerLocale(interaction.guildId);

        lang_db ? JikanCache.addOrSetServerLangCache(interaction.guildId, lang_db) : JikanCache.addOrSetServerLangCache(interaction.guildId, 'en-US');
        interaction.jikan_server_locale = lang_db;
    } else {
        interaction.jikan_server_locale = lang_cache;
    }

    if (interaction.isChatInputCommand()) {
        let command;

        if (is_dev) {
            if (interaction.user.id !== process.env.OWNER_ID) {
                return interaction.reply("not developer (from index.js)");
            }
            command = require.cache[dev_commands_map.get(interaction.commandName)];
        } else {
            command = require.cache[commands_map.get(interaction.commandName)];
        }

        try {
            const command_permissions = command.exports?.permissions;

            if (command_permissions && !interaction.memberPermissions.has(command_permissions)) {
                interaction.reply(getLocaleTranslation(lang_cache, 'system.no_permissions'));

                return;
            }

            command.exports.run(client, interaction);
        } catch (e) {
            interaction.reply({
                content: `${getLocaleTranslation(interaction.locale, 'system.command_error')}\n${code_block(e)}`,
                flags: [discord.MessageFlags.Ephemeral]
            })        
        }
    }

    if (interaction.isButton()) {
        try {
            const button = require.cache[buttons_map.get(interaction.customId)];
            

            if (!button) {
                interaction.reply({
                    content: `${getLocaleTranslation(lang_cache, 'system.button_not_implemented')} :rage::rage::rage:`,
                    flags: [discord.MessageFlags.Ephemeral]
                });

                return;
            }
            
            const button_permissions = button.exports?.permissions;

            if (button_permissions && !interaction.memberPermissions.has(button_permissions)) {
                interaction.reply(getLocaleTranslation(lang_cache, 'system.no_permissions'));

                return;
            }

            button.exports.run(client, interaction);
        } catch (e) {
            interaction.reply({
                content: `${getLocaleTranslation(interaction.locale, 'system.command_error')}\n${code_block(e)}`,
                flags: [discord.MessageFlags.Ephemeral]
            })
        }
    }

    if (interaction.isModalSubmit()) {
        try {
            const modal = require.cache[modals_map.get(interaction.customId)];
            
            if (!modal) {
                interaction.reply({
                    content: `${getLocaleTranslation(lang_cache, 'system.button_not_implemented')} :rage::rage::rage:`,
                    flags: [discord.MessageFlags.Ephemeral]
                });

                return;
            }
            
            const modal_permissions = modal.exports?.permissions;

            if (modal_permissions && !interaction.memberPermissions.has(modal_permissions)) {
                interaction.reply(getLocaleTranslation(lang_cache, 'system.no_permissions'));

                return;
            }

            modal.exports.run(client, interaction);
        } catch(e) {

        }
    }
})

client.on('clientReady', async ls => {
    try {
        //await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
        //console.log('refreshed global')

        await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.DEV_GUILD_ID), { body: dev_commands_array });
        console.log('refreshed guild commands')

        console.log("Ready to listen to events")
    } catch(err) {
        console.log(err)
    }
})

client.on('voiceStateUpdate', async (os, ns) => {
    if (process.env.NOVC == "true") return;
    if (!os && !ns) return;
    if (ns.member.user.bot) return;

    //if (ns.guild.id != "930768088121626634") return;
    // uncomment for testing

    if (
        JikanCache.isBanIDExist(ns.member.id) || JikanCache.isBanIDExist(ns.guild.id)) {
        //interaction.reply("ur not allowed boy")
        return;
    }

    if (os.channel !== ns.channel) {
        voice_update_module.changeDetected(os, ns, client)
    }
})

client.on('guildCreate', async guild => {
    JikanMySQLDatabase.createServerData(guild.id)
})

client.on('guildDelete', async guild => {
    JikanTempTime.removeServer(guild.id);
})

process.on('uncaughtException', (a) => {
    console.log(a);
}) 

client.login(process.env.BOT_TOKEN).then(async () => {
    try {
        const fetched_banlist = await JikanMySQLDatabase.getBanList();

        fetched_banlist.forEach((e) => {
            JikanCache.addBanID(e.id);
        })
    } catch (e) {
        throw new Error(e.message);
    } finally {
        console.log("Online")
    }
})