import { SlashCommandBuilder } from "discord.js";

export const command = new SlashCommandBuilder()
.setName("apple")
.setDescription("測試用指令");

export const execute = async (interaction) => {
  //await interaction.reply("apple!");
    await interaction.reply({
        content: "apple!",
        files: ['./src/media/image/b.jpg'] // 或者 ["./local/path/to/image.jpg"]
    });
}