import { REST, Routes } from "discord.js";
const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

rest.get(Routes.applicationCommands(process.env.APPLICATION_ID))
    .then(commands => {
        for (const command of commands) {
            console.log(`Command name: ${command.name}, Command ID: ${command.id}`);
        }
    })