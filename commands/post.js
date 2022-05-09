const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('post')
		.setDescription('Post message in the marketplace')
        .addStringOption(option =>
            option.setName('type')
            .setDescription('Is your post to hire someone or to sell something?')
            .setRequired(true)
            .addChoices({
                name: 'Hiring',
                value: 'Hiring'
            })
            .addChoices({
                name: 'Selling',
                value: 'Selling'
            })
        )
        .addStringOption(option =>
            option.setName('body')
            .setDescription('Explain what you are trying to achieve!')
            .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('robux')
            .setDescription('Amount willing to give or ask for!')
            .setRequired(true)
        )
        .addAttachmentOption(image =>
            image.setName('image')
            .setDescription('Attach image with your post')
            .setRequired(false)
        ),
};