const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
	const browser = await puppeteer.launch({ headless: false });
	const page = await browser.newPage();

	await page.goto('https://usis.bracu.ac.bd/academia/');

	// Type into search box
	await page.type('#username', 'mosheur.r.wolied@gmail.com');
	await page.type('#password', '@Wolied123');

	// Wait and click on first result
	const login = '#ctl00_leftColumn_ctl00_btnLogin';
	await page.click(login);
	console.log('Logged in');

	const classScheduleLink = 'https://usis.bracu.ac.bd/academia/dashBoard/show#/academia/studentCourse/showClassScheduleInTabularFormatByStudent?917&9170.3049797942977186';
	await page.goto(classScheduleLink);

	console.log('Loading class schedule');

	await page.type('#academiaYear', '2023');
	await page.type('#academiaSession', 'Summer', { delay: 100 });

	await page.setRequestInterception(true);

	page.on('request', (request) => {
		const originalUrl = request.url();
		const modifiedUrl = originalUrl.replace('rows=50', 'rows=-1');

		request.continue({ url: modifiedUrl });
	});

	await page.click('#search-button');

	console.log('class schedule loaded');

	page.on('response', async (response) => {
		const responseBody = await response.text();

		const filePath = 'data.json';

		// Write the JSON string to a new file
		fs.writeFile(filePath, responseBody, (err) => {
			if (err) {
				console.error('Error writing file:', err);
			} else {
				console.log('File saved successfully!');
			}
		});

		console.log('Received response:');
		console.log('Response Body:', responseBody);
	});

	browser.close();
})();
