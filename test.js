const cron = require('node-cron');

cron.schedule('*/2 * * * * *', () => {
	console.log('running a task every 2 seconds');
});

console.log('start');
