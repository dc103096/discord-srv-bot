import { SlashCommandBuilder } from "discord.js";

export const command = new SlashCommandBuilder()
    .setName("chat")
    .setDescription("Example slash command with parameter")
    .addStringOption(option =>
        option.setName("message")
            .setDescription("The message")
            .setRequired(true));

export const execute = async (interaction) => {
    const message = interaction.options.getString("message");
    let response;
    //const prompt = message;
    
    await interaction.deferReply();
    // for cached prompt
    let slot_id = -1;
    const API_URL = 'http://127.0.0.1:8080'
    
    const instruction = `A chat between a curious human and an artificial intelligence assistant. The assistant gives helpful, detailed, and polite answers to the human's questions.`

    const chat = [
        {
            human: "Hi",
            assistant: "Hello. I am an AI chatbot. Would you like to talk?"
        },
        {
            human: "Sure!",
            assistant: "What would you like to talk about?"
        },
        {
            human: "Please give me the python code for Fibonacci sequence.",
            assistant: "Certainly! Here's a simple Python code for generating the Fibonacci sequence: \
            \
            def fibonacci(n): \
                fib_sequence = [0, 1] \
                while len(fib_sequence) < n: \
                    fib_sequence.append(fib_sequence[-1] + fib_sequence[-2]) \
                return fib_sequence[:n] \
             \
            # Example: Print the first 10 numbers in the Fibonacci sequence \
            n = 10 \
            result = fibonacci(n) \
            print(result)"
        },
        {
            human: "What is the distance between the earth and the moon.",
            assistant: "The distance between the Earth and the Moon varies because both celestial bodies follow elliptical orbits around their common center of mass. On average, the distance is approximately 384,400 kilometers (238,855 miles). This average distance is often referred to as the \"mean Earth-Moon distance\" or \"lunar distance.\" It's essential to note that the actual distance can range from about 363,300 kilometers (225,623 miles) at its closest (perigee) to approximately 405,500 kilometers (251,966 miles) at its farthest (apogee)."
        },
    ]

    function format_prompt(question) {
        return `${instruction}\n${
            chat.map(m =>`### Human: ${m.human}\n### Assistant: ${m.assistant}`).join("\n")
        }\n### Human: ${question}\n### Assistant:`
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
                stop: ["\n### Human:"], // stop completion after generating this
            })
        })

        if (response.ok) {
            const data = await response.json();
            //console.log((await data.json()).content)
            await interaction.editReply(`Question: ${message}\nAnswer: ${data.content}`);
            chat.push({ human: message, assistant: data.content })
            console.log(chat)
        } else {
            await interaction.editReply("拉K哥的LLM還沒上線喔!");
        }
        
    } catch (error) {
        console.error(error);
        await interaction.editReply("拉K哥的LLM還沒上線喔!");
    }
}
