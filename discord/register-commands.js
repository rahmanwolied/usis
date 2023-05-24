require('dotenv').config();
const { REST, Routes, ApplicationCommandOptionType } = require('discord.js');

const commands = [
	{
		name: 'get-status',
		description: 'Get the status of a course',
		options: [
			{
				name: 'course-names',
				description: 'Names of the courses you want to check',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'sections',
				description: 'The sections you want to check',
				type: ApplicationCommandOptionType.String,
				required: false,
			},
			{
				name: 'faculties',
				description: 'The faculties of the course you want to check',
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	},
	{
		name: 'monitor-status',
		description: 'Monitor the status of multiple courses',
		options: [
			{
				name: 'course-names',
				description: 'Names of the courses you want to check (separated by spaces)',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'sections',
				description: 'The sections you want to check (01 02, 01 02 03)',
				type: ApplicationCommandOptionType.String,
				required: true,
			},
			{
				name: 'faculties',
				description: 'The faculties of the course you want to check (MZU TAW, SIF TBA ASE)',
				type: ApplicationCommandOptionType.String,
				required: false,
			},
		],
	},
	{
		name: 'stop-monitoring',
		description: 'Stops monitoring the courses',
	},
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
	try {
		await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID_OKAY), { body: commands });
		await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID_TEST), { body: commands });
	} catch (error) {
		console.error('there was an error', error);
	}
})();
