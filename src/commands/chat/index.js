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
            .setRequired(true));

export const execute = async (interaction) => {
    let chat;
    const tempFilePath = path.join(__dirname, 'temp.js');
    const originalChatFilePath = path.join(__dirname, 'chat.js');

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
            chat.map(m =>`### ユーザー: ${m.ユーザー}\n### 紫咲シオン: ${m.紫咲シオン}`).join("\n")
        }\n### ユーザー: ${question}\n### 紫咲シオン:`
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
                temperature: 0.2,
                top_k: 40,
                top_p: 0.9,
                n_keep: n_keep,
                n_predict: 256,
                slot_id: slot_id,
                stop: ["\n### ユーザー:"], // stop completion after generating this
            })
        })

        if (response.ok) {
            const data = await response.json();
            //console.log((await data.json()).content)
            await interaction.editReply(`Question: ${message}\nAnswer: ${data.content}`);
            chat.push({ ユーザー: message, 紫咲シオン: data.content })
            fs.writeFileSync(tempFilePath, `module.exports = ${JSON.stringify(chat, null, 2)};`);
            console.log(instruction)
            console.log(chat)
        } else {
            await interaction.editReply("拉K哥的LLM還沒上線喔!");
        }
        
    } catch (error) {
        console.error(error);
        await interaction.editReply("拉K哥的LLM還沒上線喔!");
    }
}
