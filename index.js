const { loadEnvFile } = require('node:process');
const fs = require('fs')
loadEnvFile('.env');

const { REST, Routes } = require('discord.js');
const rest = new REST({version: '10'}).setToken(process.env.BOT_TOKEN);
const { is_devcommand, JikanDBError } = require('./utils.js')
const discord = require('discord.js')
const jmysql = require('./jikan_mysql_manager.js');
const db = new jmysql();
const voice_update_module = require('./events/voice_update.js');

/////
const commands_array = [];
const dev_commands_array = [];
const dev_commands_names = [];
const command_files = fs.readdirSync('./commands/public/').filter(file => file.endsWith('.js'));
const dev_command_files = fs.readdirSync('./commands/dev/').filter(file => file.endsWith('.js'));
/////

/////
for (let file of dev_command_files) {
    const command = require(`./commands/dev/${file}`)
    if (command.data) {
        dev_commands_array.push(command.data.toJSON());
        dev_commands_names.push(command.data.name);
        // console.log(command.data.toJSON())
    }
}

for (let file of command_files) {
    const command = require(`./commands/public/${file}`)
    if (command.data) {
        commands_array.push(command.data.toJSON())
        // console.log(command.data.toJSON())
    }
}
/////

const client = new discord.Client({
    intents: ['Guilds', "GuildVoiceStates"]
});

client.database = db;

client.on('interactionCreate', async interaction => {
    if (interaction.isChatInputCommand()) {
        let module;
        
        console.log(is_devcommand(interaction.commandName, dev_commands_names));
        if (is_devcommand(interaction.commandName, dev_commands_names)) {
            if (!interaction.user.id.includes(process.env.OWNER_ID)) {
                return interaction.reply("not developer (from index.js)");
            }
            module = require(`./commands/dev/${interaction.commandName}.js`)
        } else {
            module = require(`./commands/public/${interaction.commandName}.js`)
        }

        try {
            module.run(discord, client, interaction);
        } catch (e) {
            if (e instanceof JikanDBError) {
                interaction.reply("Fatal error ID 10001");
            }
        }
        
    }
})

client.on('clientReady', async ls => {
    //refresh_modules()
    try {
        await rest.put(Routes.applicationCommands(client.user.id), { body: commands_array });
        console.log('refreshed global')

        await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.DEV_GUILD_ID), { body: dev_commands_array });
        console.log('refreshed guild command')
    } catch(err) {
        console.log(err)
    }
})

client.on('voiceStateUpdate', async (os, ns) => {
    if (!os && !ns) return;
    if (ns.member.user.bot) return;

    if (os.channel !== ns.channel) {
        voice_update_module.changeDetected(os, ns, client)
    }
})

client.login(process.env.BOT_TOKEN).then(async() => {
    console.log("Online")
})

process.on('uncaughtException', (a) => {
    console.log(a);
}) 