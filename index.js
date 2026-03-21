const { loadEnvFile } = require('node:process');
const fs = require('fs')
loadEnvFile('.env');

const { REST, Routes } = require('discord.js');
const rest = new REST({version: '10'}).setToken(process.env.BOT_TOKEN);
const { JikanDBError, consoleColor } = require('./static/utils.js')
const discord = require('discord.js')
const jmysql = require('./static/jikan_mysql_manager.js');
const voice_update_module = require('./events/voice_update.js');
const path = require('path');
const refresh_modules = require('./refresh_modules.js');

const commands_map = new Map();
const dev_commands_map = new Map();
const banlist_cache = new Set();

const commands_array = [];
const dev_commands_array = [];

const command_files = fs.readdirSync('./commands/public/').filter(file => file.endsWith('.js'));
const dev_command_files = fs.readdirSync('./commands/dev/').filter(file => file.endsWith('.js'));

const button_events = require('./events/button.js');
// just need the cache

for (let file of dev_command_files) {
    const command = require(`./commands/dev/${file}`)
    if (command.data) {
        dev_commands_map.set(command.data.name, path.resolve(__dirname, 'commands', 'dev', file));
        dev_commands_array.push(command.data.toJSON());
    }
}

for (let file of command_files) {
    const command = require(`./commands/public/${file}`)
    if (command.data) {
        commands_map.set(command.data.name, path.resolve(__dirname, 'commands', 'public', file));
        commands_array.push(command.data.toJSON())
    }
}

const client = new discord.Client({
    intents: ['Guilds', "GuildVoiceStates"]
});

client.database = jmysql;

client.on('interactionCreate', async interaction => {
    const is_dev = dev_commands_map.has(interaction.commandName);

    if (banlist_cache.has(interaction.user.id) || banlist_cache.has(interaction.guild.id)) {
        await interaction.reply("The user/server is not allowed to use Jikan.\nThe decision is final, you may **__NOT__** request for unbans.\n\n[READ THE TERMS OF SERVICE](<https://ironworks.neocities.org/apps/Jikan/tos/>)")
        return;
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
            command.exports.run(discord, client, interaction);
        } catch (e) {
            if (e instanceof JikanDBError) {
                interaction.reply("Fatal error ID 10001");
            } else {
                throw new Error(e.message);
            }
        }
    }

    if (interaction.isButton()) {
        try {
            let button = require.cache[path.resolve(__dirname, 'events', 'button.js')];
            button.exports.run(discord, client, interaction);
        } catch (e) {
            if (e instanceof JikanDBError) {
                interaction.reply("Fatal error ID 10001");
            } else {
                throw new Error(e.message);
            }
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
    if (!os && !ns) return;
    if (ns.member.user.bot) return;

    //if (ns.guild.id != "930768088121626634") return;
    // uncomment for testing

    /*
    const guild_id = ns.guild.id;
    if (!await client.database.checkGuildDBAvailability(guild_id)) {
        console.log(consoleColor(`either JikanGuildLeaderboard and JikanGuildLeaderboardTemp has no record for Guild ${guild_id}`, "yellow"));
        await client.database.createServerData(ns.guild.id)
    }
    */

    if (banlist_cache.has(ns.member.id) || banlist_cache.has(ns.guild.id)) {
        //interaction.reply("The user/server is not allowed to use Jikan. Performing data reset.")
        return;
    }

    if (os.channel !== ns.channel) {
        voice_update_module.changeDetected(os, ns, client)
    }
})

client.on('guildCreate', async guild => {
    client.database.createServerData(guild.id)
})

client.login(process.env.BOT_TOKEN).then(async () => {
    try {
        const fetched_banlist = await client.database.getBanList();

        fetched_banlist.forEach((e) => {
            banlist_cache.add(e.id);
        })
    } catch (e) {
        throw new Error(e.message);
    } finally {
        console.log("Online")
    }
})

process.on('uncaughtException', (a) => {
    console.log(a);
}) 