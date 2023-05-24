const { spawn } = require('child_process');
const cron = require('node-cron');

// Function to start the cron task in a separate process
function startCronTask() {
	const cronProcess = spawn('node', ['test.js']);

	// Handle the output/error of the cron process if needed
	cronProcess.stdout.on('data', (data) => {
		console.log(`Child Process: ${data}`);
	});

	cronProcess.stderr.on('data', (data) => {
		console.error(`Cron Process Error: ${data}`);
	});
}

// Start the cron task
startCronTask();

cron.schedule('*/5 * * * * *', () => {
	console.log('running a task every 5 seconds');
});

console.log('start');
