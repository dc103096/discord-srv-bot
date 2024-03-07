import { SlashCommandBuilder } from "discord.js";

export const command = new SlashCommandBuilder()
.setName("ip")
.setDescription("查看當前伺服器的IP位址");

export const execute = async (interaction) => {
  await interaction.reply(process.env.SERVER_DNS);
}