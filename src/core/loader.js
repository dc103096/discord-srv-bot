import { REST, Routes, Collection } from "discord.js";
import fg from "fast-glob";
import { useAppStore } from '@/store/app'

const updateSlashCommands = async(commands) => {
    const rest = new REST({ version: 10 }).setToken(process.env.TOKEN);
    const result = await rest.put(
        Routes.applicationGuildCommands(
            process.env.APPLICATION_ID,
            '972409339090448424'
        ),
        {
            body: commands,
        }
    )

    console.log(result)
}

export const loadCommands = async () => {
    const appStore = useAppStore()
    const commands = []
    const actions = new Collection()
    const files = await fg('./src/commands/**/index.js')
    //console.log(files);
    for(const flie of files) {
        const cmd = await import(flie)
        commands.push(cmd.command)
        actions.set(cmd.command.name, cmd.execute)
        //console.log(cmd.command)
    }

    await updateSlashCommands(commands)
    appStore.commandsActionMap = actions

    console.log(appStore.commandsActionMap)
}

export const loadEvents = async () => {
    const appStore = useAppStore()
    const client = appStore.client
    const files = await fg('./src/events/**/index.js')
    for(const file of files) {
        const eventFile = await import(file)

        if(eventFile.event.once) {
            client.once(
                eventFile.event.name, 
                eventFile.action
            )
        } else {
            client.on(
                eventFile.event.name, 
                eventFile.action
            )
        }
    }
}