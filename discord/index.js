require('dotenv').config();
const { Client, IntentsBitField, EmbedBuilder } = require('discord.js');
const cron = require('node-cron');
const { useData, getCookie } = require('../getStatus');
const login = require('../login');
const filePath = './cookies.json';
const findEmptyLab = require('../findEmptyLab');

// function startCronTask(cookie, courses) {
// 	courses = JSON.stringify(courses);
// 	const cronProcess = spawn('node', ['./monitor_status.js', cookie, courses]);

// 	// Handle the output/error of the cron process if needed
// 	cronProcess.stdout.on('data', (data) => {
// 		console.log(`Child Process: ${data}`);
// 		return data;
// 	});

// 	cronProcess.stderr.on('data', (data) => {
// 		console.error(`Cron Process Error: ${data}`);
// 		return data;
// 	});
// }

const client = new Client({
	intents: [
		IntentsBitField.Flags.Guilds,
		IntentsBitField.Flags.GuildMessages,
		IntentsBitField.Flags.GuildMembers,
		IntentsBitField.Flags.MessageContent,
	],
});

client.on('ready', (c) => {
	console.log(`✅${c.user.tag} is ready`);
});

let monitoring = false;
let task = null;

client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand) return;

	if (interaction.commandName === 'get-status') {
		await interaction.reply('Start...');

		const cookie = await getCookie(filePath);
		await interaction.channel.send('Cookies Set');

		const courseNames = interaction.options.get('course-names').value.split(' ');
		if (interaction.options.get('sections')) var sections = interaction.options.get('sections').value.split(', ');
		if (interaction.options.get('faculties')) var faculties = interaction.options.get('faculties').value.split(', ');

		if ((sections && courseNames.length != sections.length) || (faculties && courseNames.length != faculties.length)) {
			await interaction.followUp('Invalid Input. Please input the same number of courses, sections and faculties');
			return;
		}
		let courses = [];
		for (let i = 0; i < courseNames.length; i++) {
			if (sections) var section = sections[i].split(' ');
			if (faculties) var faculty = faculties[i].split(' ');
			courses.push({
				name: courseNames[i],
				sections: section,
				faculties: faculty,
			});
		}

		await interaction.channel.send('Starting Fetch...');

		let data = await useData(cookie, courses, false, interaction);

		const embed = new EmbedBuilder().setTitle('Course Status').setColor('Random').addFields({
			name: 'Course',
			value: data,
		});

		await interaction.channel.send('Fetch ended');
		await interaction.followUp({ embeds: [embed] });
		await interaction.channel.send('Task Ended');
	}

	if (interaction.commandName === 'monitor-status') {
		if (monitoring) {
			interaction.reply('Already monitoring...');
			return;
		} else {
			monitoring = true;
			let requests = 0;

			await interaction.reply('Starting task...');
			await interaction.channel.send('Loging in...');
			await login();
			await interaction.channel.send('Logged in');

			const courseNames = interaction.options.get('course-names').value.split(' ');
			const sections = interaction.options.get('sections').value.split(', ');
			if (interaction.options.get('faculties')) var faculties = interaction.options.get('faculties').value.split(', ');

			if (courseNames.length != sections.length || (faculties && courseNames.length != faculties.length)) {
				await interaction.followUp('Invalid Input. Please input the same number of courses, sections and faculties');
				return;
			}
			let courses = [];
			await interaction.channel.send('Monitoring data for: ');

			for (let i = 0; i < courseNames.length; i++) {
				let section = sections[i].split(' ');
				if (faculties) var faculty = faculties[i].split(' ');
				courses.push({
					name: courseNames[i],
					sections: section,
					faculties: faculty,
				});
				await interaction.channel.send(`${courseNames[i].toUpperCase()}(${section})`);
			}

			const cookie = await getCookie(filePath);

			task = cron.schedule('*/20 * * * * *', async () => {
				let output = await useData(cookie, courses, true, interaction);
				let data = output[0];
				requests += output[1];
				// await client.channels.cache.get(1110865943665582102).setName(`📁 requests-${requests}`);

				for (let i = 0; i < data.length; i++) {
					console.log(`${data[i][2]} Section ${data[i][7]}(${data[i][5]}) : ${data[i][10]}`);

					if (data[i][10] !== '' && data[i][10][0] !== '-') {
						await interaction.followUp(`${data[i][2]} Section ${data[i][7]} : ${data[i][10]}`);
					}
				}
				console.log('\n');
				console.log('request count: ' + requests.toString() + '\n');
			});

			await interaction.channel.send('Task Started');
		}
	}

	if (interaction.commandName === 'stop-monitoring') {
		if (!monitoring) {
			await interaction.reply('Not monitoring. Already stopped.');
			return;
		} else {
			monitoring = false;
			await interaction.reply('Stopping Task...');

			if (task) {
				task.stop();
				task = null;
				await interaction.followUp('Task Stopped');
				console.log('Task Stopped');
			} else {
				await interaction.followUp('No task to stop.');
			}
		}
	}

	if (interaction.commandName === 'find-empty-lab') {
		await interaction.reply('Start...');
		const data = await findEmptyLab();
		const freeLabsWithCourses = data.freeLabs;
		let output = '';
		let i = 1;
		for (let freeLab of freeLabsWithCourses) {
			const lab = freeLab.lab;
			// const course = freeLab.course.courseCode;
			output += `${i}. ${lab}\n`;
			i++;
		}

		const embed = new EmbedBuilder()
			.setTitle('Empty Labs')
			.setColor('Random')
			.addFields({
				name: `Found ${data.freeLabs.length} labs that are free right now`,
				value: output,
			});

		await interaction.followUp({ embeds: [embed] });
		await interaction.channel.send('Task Ended');
	}
});

// client.on('messageCreate', async (message) => {
// 	if (message.content === '!start-task') {
// 		// Start the task
// 		message.channel.send('Task started! 1');
// 		startCronTask();
// 		message.channel.send('Task started! 2');
// 	}
// 	if (message.content === '!continue-task') {
// 		// Stop the task
// 		cron.schedule('*/2 * * * * *', () => {
// 			console.log('running a task every 2 seconds');
// 		});
// 	}
// 	if (message.content === '!stop-task') {
// 		// Stop the task
// 		cron.cancelAll();
// 		message.channel.send('Task stopped!');
// 	}
// });

client.login(process.env.TOKEN);
