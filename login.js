const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const { stringify } = require('querystring');

async function login() {
	console.log('Logging in...');
	const browser = await puppeteer.launch({ headless: 'new' });
	const page = await browser.newPage();

	await page.goto('https://usis.bracu.ac.bd/academia/');

	// Type into search box
	await page.type('#username', 'mosheur.r.wolied@gmail.com');
	await page.type('#password', '@Wolied123');

	// Wait and click on first result
	const login = '#ctl00_leftColumn_ctl00_btnLogin';
	await page.click(login);

	await page.waitForSelector('#student-class-schedule-dashboard-div');
	console.log('Logged in successfully');

	const cookies = await page.cookies();
	// console.log(cookies);
	browser.close();

	const cookieString = JSON.stringify(cookies);
	console.log('Storing Cookie...');

	try {
		await fs.writeFile('cookies.json', cookieString);
		console.log('Cookie was succesfully stored');
	} catch (err) {
		console.error('error occured', err);
	}
}

module.exports = login;
