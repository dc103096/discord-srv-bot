import { SlashCommandBuilder } from "discord.js";
import fs from 'fs';
import path from "path";
import instruction from "./instruction.js";

export const command = new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Example slash command with parameter")
    .addStringOption(option =>
        option.setName("message")
            .setDescription("The message")
            .setRequired(false))
    .addBooleanOption(option =>
        option.setName("clear")
            .setDescription("清除temp chat")
            .setRequired(false));

export const execute = async (interaction) => {
    const tempFilePath = path.join(__dirname, 'temp.js');
    const originalChatFilePath = path.join(__dirname, 'chat.js');

    if (interaction.options.getBoolean("clear")) {
        const tempFilePath = path.join(__dirname, 'temp.js');
        fs.writeFileSync(tempFilePath, `module.exports = [];`);
        await interaction.reply("已清除temp chat!");
    } else if (interaction.options.getString("message") !== null) {

        const nickname = interaction.member.nickname;
        let chat;

        function isExportedArrayEmpty(filePath) {
            const data = fs.readFileSync(filePath, 'utf8');
            const exportedValue = eval(data);
            return Array.isArray(exportedValue) && exportedValue.length === 0;
        }

        const originalChat = fs.readFileSync(originalChatFilePath, 'utf8')
        const tempChat = fs.readFileSync(tempFilePath, 'utf8')

        if (isExportedArrayEmpty(tempFilePath)) {
            chat = eval(originalChat);
        } else {
            chat = eval(tempChat);
        }

        const message = interaction.options.getString("message");

        let response;
        
        await interaction.deferReply();

        let slot_id = -1;
        const API_URL = 'http://127.0.0.1:8080'

        function format_prompt(question) {
            return `${instruction}\n${
                chat.map(m =>`ユーザー: ${m.User}\n紫咲シオン: ${m.紫咲シオン}`).join("\n")
            }\nユーザー:「${nickname}」: ${question}\n紫咲シオン:`
        }

        async function tokenize(content) {
            const result = await fetch(`${API_URL}/tokenize`, {
                method: 'POST',
                body: JSON.stringify({ content })
            })
        
            if (!result.ok) {
                return []
            }
        
            const data = await result.json();
            return data.tokens;
        }

        try {
            const n_keep = await tokenize(instruction).length

            response = await fetch(`${API_URL}/completion`, {
                method: 'POST',
                body: JSON.stringify({
                    prompt: format_prompt(message),
                    temperature: 0.5,
                    top_k: 40,
                    top_p: 0.9,
                    n_keep: n_keep,
                    n_predict: 256,
                    slot_id: slot_id,
                    stop: ["\nユーザー:"], // stop completion after generating this
                })
            })
//「${nickname}」: 
            if (response.ok) {
                const data = await response.json();
                //console.log((await data.json()).content)
                await interaction.editReply(`${nickname}: ${message}\n\n${data.content}`);
                chat.push({ ユーザー: `「${nickname}」: ${message}`, 紫咲シオン: data.content })
                fs.writeFileSync(tempFilePath, `module.exports = ${JSON.stringify(chat, null, 2)};`);
                console.log(nickname)
                //console.log(chat)
            } else {
                await interaction.editReply("拉K哥的LLM還沒上線喔!");
            }
            
        } catch (error) {
            console.error(error);
            await interaction.editReply("拉K哥的LLM還沒上線喔!");
        }
    } else {
        await interaction.reply("請輸入訊息");
    }
}
