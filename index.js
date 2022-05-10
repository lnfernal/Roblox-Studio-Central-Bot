const fs = require('node:fs');
const { Client, Collection, Intents, StickerPack, MessageEmbed, ReactionCollector } = require('discord.js');
const { token } = require('./config.json');
const { channel } = require('node:diagnostics_channel');
const ytdl = require('ytdl-core');
const { executionAsyncResource } = require('node:async_hooks');
const {
	joinVoiceChannel,
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
} = require("@discordjs/voice");

const ytSearch = require('yt-search');
const req = require('express/lib/request');
const res = require('express/lib/response');
const { Server } = require('node:http');
const { RequestManager } = require('@discordjs/rest');
const { join } = require('node:path');
let bootups = 0;
const bot_version = '[V1.1]';

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES] });

client.commands = new Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	// Set a new item in the Collection
	// With the key as the command name and the value as the exported module
	client.commands.set(command.data.name, command);
}

const queue = new Map();

// When the client is ready, run this code (only once)
client.once('ready', () => {
	console.log('Ready!');
});
client.once('reconnecting', () => {
	console.log('Reconnecting...');
})
client.once('disconnect', () => {
	console.log('Disconnected');
})

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);

	if (!command) return;

	if (interaction.commandName === 'ping') {
		let latency = client.ws.ping;
		const embed = new MessageEmbed()
		.setColor('#0fff4f')
		.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
		.setTitle('Pong!')
		.setDescription(`Bot latency: ${latency}ms`)
		.setFooter({ text: `Roblox Studio Central Bot - ${bot_version}` })
		.setTimestamp();
		await interaction.reply({ content: `<@${interaction.user.id}>`, embeds: [embed] });
	} else if (interaction.commandName === 'play') {
		if (interaction.user.bot) return;
		const AP = interaction.member.roles.cache.some(role => role.name === 'AP');
		if (interaction.options.getSubcommand() === 'play') {
			const song = interaction.options.getString('song');
			if (AP) {
				execute(interaction, song);

			} else {
				interaction.reply({ content: 'Incorrect permissions! Role required: [AP]', ephemeral: true })
			}
		}
	} else if (interaction.commandName === 'post') {
		if (interaction.user.bot) return;
		if (!interaction.member.roles.cache.some(role => role.name === 'AP')) return interaction.reply({ content: 'Incorrect permissions! Role required: [AP]', ephemeral: true });

		if (interaction.member.roles.cache.some(role => role.name === 'AP')) {
			let id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
			const type = interaction.options.getString('type');
			const body = interaction.options.getString('body');
			const robux = interaction.options.getString('robux');
			const approvalChannel = interaction.guild.channels.cache.get('973360299744849970');
			const embed = new MessageEmbed()
				.setColor('#035efc')
				.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL(), url: 'https://robloxstudiocentral.xyz' })
				.setTitle('Marketplace Post')
				.setDescription('Your post has been sent for approval! You will be pinged in the appropriate channel when it has been approved, or you will receive a DM if it was denied.')
				.addFields([
					{
						name: 'Post Type',
						value: type
					},
					{
						name: 'Body',
						value: body
					},
					{
						name: 'Robux',
						value: robux
					},
					{
						name: 'Image',
						value: 'In development'
					},
				])
				.setFooter({ text: `Roblox Studio Central Marketplace | ID: ${id}` })
				.setTimestamp();

			interaction.reply({ content: `<@${interaction.member.user.id}>`, embeds: [embed], ephemeral: true });
			approvalChannel.send({ content: `New post approval from: <@${interaction.member.user.id}>`, embeds: [embed] });

			fs.writeFile('./posts.json', `{"${id}"}`, err => {
				if (err) {
					console.log(err);
				}
			})
		}
	}
});

// Functions

async function execute(message, song) {
	const voiceChannel = message.member.voice.channel;

	if (!voiceChannel)
		return message.reply('> **You need to join voicechannel first!**');
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT'))
		return message.reply('> **You dont have right permissions!**');
	if (!permissions.has('SPEAK'))
		return message.reply('> **You dont have right permissions!**');

	if (voiceChannel) {
		const connection = joinVoiceChannel({
			channelId: message.member.voice.channel.id,
			guildId: message.guild.id,
			adapterCreator: message.guild.voiceAdapterCreator,
		});

		const videoFinder = async (query) => {
			const videoResult = await ytSearch(query);
			return videoResult.videos.length > 1 ? videoResult.videos[0] : null;
		};

		const video = await videoFinder(song);

		if (video) {
			const stream = ytdl(video.url, { filter: 'audioonly', highWaterMark: 1 << 25, dlChunkSize: 0 });
			const player = createAudioPlayer();
			const resource = createAudioResource(stream);

			await player.play(resource);
			const subscription = connection.subscribe(player);

			stream.on('error', err => {
				console.log(err)
			});

			player.on('error', (error) => console.error(error));
			player.on(AudioPlayerStatus.Idle, () => {
				console.log(`song's finished`);
				connection.disconnect();
				subscription.unsubscribe();
			});

			const embed = new MessageEmbed()
			.setColor('#1c64ff')
			.setAuthor({ name: message.user.tag, iconURL: message.user.avatarURL() })
			.setTitle('Now Playing...')
			.setDescription(`👍 Now playing ***${video.title}***`)
			.setThumbnail(video.image)
			.setFooter({ text: `Roblox Studio Central Bot - ${bot_version}` })
			.setTimestamp();

			await message.reply({ content: `<@${message.user.id}>`, embeds: [embed] });
		} else {
			message.reply('No video results found');
		}
	}
};

// Login to Discord with your client's token
client.login(token);