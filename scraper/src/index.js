const express = require('express');
const moment = require('moment');
const agenda = require('./util/agenda');
const fteProcessors = require('./processors/fte');
const { Article } = require('./util/db');

(async () => {
	const app = express();
	app.get('/', async (req, res) => {
		const oneWeekAgo = moment().subtract(1, 'week');
		const articles = await Article
			.find({ updatedAt: { $gte: oneWeekAgo }}, '-_id -sourceUrl -__v')
			.sort({updatedAt: -1});
		res.json(articles);
	});
	app.listen(3000, () => console.log('App is listening on port 4000.'));

  	await agenda.start();
	for (const processor of fteProcessors) {
		agenda.define(processor.name, processor.func);
	}
	
	await agenda.schedule('0 6,12,18 * * *', 'fte crawl list', {}, { timezone: 'America/Chicago' });
})();
