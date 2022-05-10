const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song in a voice channel!')
        .addSubcommand((subcommand) =>
            subcommand.setName('play')
                .setDescription('Play a song')
                .addStringOption((option) =>
                    option.setName('song')
                        .setDescription('Song name')
                        .setRequired(true),
                ),
        ),
};