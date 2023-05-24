const cron = require('node-cron');
const { useData, getCookie } = require('./getStatus');
const { json } = require('express');

let cookie = process.argv[2];
let courses = process.argv[3];

courses = JSON.parse(courses);

console.log(`Received parameters: \nCookie: ${cookie},\n Courses:\n`);

for (let i = 0; i < courses.length; i++) {
	let course = courses[i];
	console.log(course.name);
	console.log(course.sections);
	console.log(course.faculties);
	console.log('');
}

// console.log('Starting monitor');

// cron.schedule('*/1 * * * *', async () => {
// 	let data = await useData(cookie, course);
// });
