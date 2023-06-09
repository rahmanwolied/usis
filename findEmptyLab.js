const puppeteer = require('puppeteer');
const fs = require('fs').promises;

require('dotenv').config();

module.exports = async () => {
	console.log('Logging in...');

	const browser = await puppeteer.launch({ headless: 'new' });
	const page = await browser.newPage();

	await page.goto(
		'https://usis.bracu.ac.bd/academia/admissionRequirement/getAvailableSeatStatus?fbclid=IwAR31yS2LZUcbTgFdvKOvz4GWAeJX8flqbOkQbDjQES4ZlAT5ciJbus-3g90'
	);

	await page.waitForSelector('#customers');

	// Extract the table rows and store them in an array
	const tableRows = await page.$$eval('#customers tr', (rows) =>
		rows.map((row) => Array.from(row.querySelectorAll('td')).map((cell) => cell.innerText))
	);

	// Close the browser
	await browser.close();
	let schedule = [];
	let labs = [];
	// Extract the schedule from the table rows
	for (tableRow of tableRows) {
		// CourseCode Program Faculty	Credit	Section	Day, Time, Room	Total Seat	Seat Booked	Seat Remaining
		let scheduleObj = {
			courseCode: tableRow[1],
			program: tableRow[2],
			faculty: tableRow[3],
			credit: tableRow[4],
			section: tableRow[5],
		};

		let classInfo = [];
		let days = tableRow[6].split(') ');

		days.forEach((day) => {
			const splitString = day.split('-');

			const dayString = splitString[0].substring(0, 2);
			const startTime = splitString[0].substring(3);
			const endTime = splitString[1];
			let room = splitString[2];

			if (room && room.includes(')')) room = room.replace(')', '');

			const classObject = {
				day: dayString,
				start: startTime,
				end: endTime,
				room: room,
			};

			classInfo.push(classObject);
		});

		if (classInfo.length > 2) {
			for (let i = 0; i < classInfo.length; i++) {
				if (i + 1 < classInfo.length && classInfo[i].day === classInfo[i + 1].day && classInfo[i].room === classInfo[i + 1].room) {
					classInfo[i].end = classInfo[i + 1].end;
					classInfo.splice(i + 1, 1);
					classInfo[i].type = 'Lab';
					if (!labs.includes(classInfo[i].room)) labs.push(classInfo[i].room);
				} else {
					classInfo[i].type = 'Theory';
				}
			}

			scheduleObj.days = classInfo;
			schedule.push(scheduleObj);
		}
	}

	// delete first item from schedule array
	schedule.shift();

	const currentDate = new Date();
	const currentDay = currentDate.toLocaleString('en-US', { weekday: 'short' }).slice(0, 2);

	// const currentDay = 'Su';
	// const currentTime = '02:01 PM';
	const currentTime = currentDate.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
	const arr = [];

	schedule.forEach((course) => {
		const days = course.days;
		const matchingDay = days.find((day) => day.day === currentDay && day.start <= currentTime && day.end >= currentTime && day.type === 'Lab');
		if (matchingDay) {
			arr.push(matchingDay.room);
		}
	});
	const occupiedLabs = [...new Set(arr)];
	const freeLabs = labs.filter((lab) => !occupiedLabs.includes(lab));

	// console.log(freeLabs);
	// Write schedule to a file
	output = {
		labs: labs,
		schedule: schedule,
		freeLabs: freeLabs,
	};

	const scheduleString = JSON.stringify(output);
	console.log('Storing schedule...');
	try {
		await fs.writeFile('schedule.json', scheduleString);
		console.log('Schedule was succesfully stored');
	} catch (err) {
		console.error('error occured', err);
	}

	return output;
};
