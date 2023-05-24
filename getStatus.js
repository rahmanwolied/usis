const fetch = require('node-fetch');
const fs = require('fs').promises;
const login = require('./login');
const filePath = './cookies.json';

async function getCookie(path) {
	try {
		let data = await fs.readFile(path, 'utf8');
		const jsonData = JSON.parse(data);

		let cookieParsed = `JSESSIONID=${jsonData[1].value}; SRVNAME=${jsonData[0].value}; accordion=""`;
		console.log(cookieParsed);
		return cookieParsed;
	} catch (err) {
		console.error('Error parsing JSON:', err);
	}
}

async function fetchData(cookieParsed, courses, monitor) {
	let output = '';
	let jsonOutput = [];
	for (let i = 0; i < courses.length; i++) {
		let course = courses[i];
		let url = `https://usis.bracu.ac.bd/academia/studentCourse/showCourseStatusList?query=${course.name}&academiaSession=627121&_search=false&nd=1684693332808&rows=50&page=1&sidx=id&sord=desc`;
		let requestOptions = {
			headers: {
				accept: 'application/json, text/javascript, */*; q=0.01',
				'accept-language': 'en-US,en;q=0.9',
				'content-type': 'application/x-www-form-urlencoded',
				'sec-ch-ua': '"Google Chrome";v="113", "Chromium";v="113", "Not-A.Brand";v="24"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"macOS"',
				'sec-fetch-dest': 'empty',
				'sec-fetch-mode': 'cors',
				'sec-fetch-site': 'same-origin',
				'x-requested-with': 'XMLHttpRequest',
				cookie: cookieParsed,
				Referer: 'https://usis.bracu.ac.bd/academia/dashBoard/show',
				'Referrer-Policy': 'strict-origin-when-cross-origin',
			},
			body: null,
			method: 'GET',
		};

		const response = await fetch(url, requestOptions);

		if (!response.ok) {
			console.log('Request failed with status ' + response.status);
			throw new Error('Cookie Expired. Resetting the request');
		}

		const data = await response.json();

		for (const row of data.rows) {
			if (
				(course.sections === undefined && course.faculties === undefined) ||
				(course.sections === undefined && course.faculties.includes(row.cell[5])) ||
				(course.faculties === undefined && course.sections.includes(row.cell[7])) ||
				(course.sections && course.sections.includes(row.cell[7])) ||
				(course.faculties && course.faculties.includes(row.cell[5]))
			) {
				if (monitor) jsonOutput.push(row.cell);
				else {
					console.log('Course: ' + row.cell[2]);
					output += 'Course: ' + row.cell[2] + '\n';

					console.log('Faculty: ' + row.cell[5]);
					output += 'Faculty: ' + row.cell[5] + '\n';

					console.log('Section: ' + row.cell[7]);
					output += 'Section: ' + row.cell[7] + '\n';

					if (row.cell[10] !== '') {
						console.log('Seat Remaining: ' + row.cell[10] + '\n');
						output += 'Seat Remaining: ' + row.cell[10] + '\n\n';
					} else {
						console.log('Seat Remaining: 0' + '\n\n');
						output += 'Seat Remaining: 0' + '\n\n';
					}
				}
			}
		}
	}
	if (monitor) return jsonOutput;
	return output;
}

async function useData(cookieParsed, courses, monitor) {
	try {
		const output = await fetchData(cookieParsed, courses, monitor);
		return output;
	} catch (error) {
		console.error(error);
		if (error.message === 'Cookie Expired. Resetting the request') {
			console.log('Cookie Expired. Resetting the request after 10 seconds');
			await login();
			cookieParsed = await getCookie(filePath);
		} else {
			console.log('Error occurred. Retrying after 10 seconds');
		}

		await delay(10000); // Wait for 10000 milliseconds (10 seconds)

		return useData(cookieParsed, courses, monitor); // Retry the fetchData function
	}
}

function delay(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { useData, getCookie };
