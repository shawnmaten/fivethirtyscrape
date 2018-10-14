const express = require('express');
const moment = require('moment');
const { agenda, wrapJob } = require('./util/agenda');
const fteProcessors = require('./processors/fte');
const { Article } = require('./util/db');
const { parseMoment } = require('./util/data');

function checkHealth(job, article) {
	const now = moment();
	let error = null;

	const lastCrawlFail = parseMoment(job.attrs.failedAt);
	const lastCrawl = parseMoment(job.attrs.lastFinishedAt);
	const lastArticle = parseMoment(article.updatedAt);

	if (lastCrawl.isSame(lastCrawlFail)) {
		error = 'last crawl failed';
	} else if (now.diff(lastCrawl, 'hours') > 6) {
		error = 'last crawl was too long ago';
	} else if (now.diff(lastArticle, 'hours') > 48) {
		error = 'last article is too old';
	}

	return {
		'error': error,
		'lastCrawl': lastCrawl,
		'lastCrawlFail': lastCrawlFail,
		'lastArticle': lastArticle
	};
}

(async () => {
	const app = express();

	app.get('/', async (req, res) => {
		const oneWeekAgo = moment().subtract(1, 'week');
		const articles = await Article
			.find({ updatedAt: { $gte: oneWeekAgo }}, '-_id -sourceUrl -__v')
			.sort({updatedAt: -1});
		res.json(articles);
	});

	app.get('/health', async (req, res) => {
		const job = (await agenda.jobs({ name: 'fte crawl list'}))[0];
		const article = await Article.findOne().sort({ updatedAt: -1 });
		const report = checkHealth(job, article);
		const code = report.error ? 500 : 200;
		res.status(code).json(report);
	});

	for (const processor of fteProcessors) {
		agenda.define(processor.name, wrapJob(processor.func));
	}

	agenda.on('start', job => {
		console.error(`job "${job.attrs.name}" started`);
	});

	agenda.on('success', job => {
		console.error(`job "${job.attrs.name}" finished`);
	});

	agenda.on('fail', (err, job) => {
		console.error(`job "${job.attrs.name}" failed`);
	});

	await agenda.start();

	const crontab = '0 0,6,12,18 * * *';
	const options = { timezone: 'America/New_York' };
	const job = await agenda.every(crontab, 'fte crawl list', {}, options);
	job.run();

	app.listen(3000, () => console.log('App is listening on port 3000.'));
})();

module.exports.checkHealth = checkHealth;
