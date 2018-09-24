const moment = require('moment');
const browserless = require('../util/browserless');
const db = require('../util/db');
const Article = db.Article;
const agenda = require('../util/agenda');

module.exports = [
  { name: 'fte crawl list', func: crawlList },
  { name: 'fte scrape article', func: scrapeArticle }
];

// Navigate through article list pages and evaluate scrape function
async function crawlList(job, done) {
  const start = Date.now();

  const lastArticle = await Article.findOne().sort({ updatedAt: -1 });
  const cutoffDate = lastArticle ? moment(lastArticle.updatedAt) : moment().subtract(1, 'week');

  console.log(`Crawling fte articles with cutoff ${cutoffDate.format('lll')}`);

  const browser = await browserless.getBrowser();
  const page = await browser.newPage();

  var nextUrl = 'https://fivethirtyeight.com/features';
  var articles = [];
  while (nextUrl) {
    console.log(`Loading ${nextUrl}`);
    await page.goto(nextUrl, browserless.defaultPageOpts);
    const data = await page.evaluate(getListData);
    
    const newArticles = data.articles.filter((article) => {
      const articleDate = moment(article.date);
      return articleDate.isAfter(cutoffDate);
    });
    articles = articles.concat(newArticles);

    if (newArticles.length == data.articles.length) {
      nextUrl = data.nextUrl; // Didn't reach the cutoff date
    } else {
      nextUrl = null; // Reached the cutoff date
    }
  }

  for (const article of articles) {
    agenda.now('fte scrape article', { url: article.url });
  }

  await page.close();
  await browser.close();

  const end = Date.now();
  console.log(`Found ${articles.length} new articles in ${(end-start)/1000} seconds`);

  done();
}

// Run in the browser, retrieves date and url for each article
function getListData() {
  const articleNodes = Array.from(document.querySelectorAll('.fte_features'));
  const articles = articleNodes.map(node => {
    return {
      date: node.querySelector('time').title,
      url: node.dataset.href
    }
  })
  const nextNode = document.querySelector('.link-sectionmore:not(.sectionprevious)');
  const nextUrl = nextNode ? nextNode.href : null;
  return { articles: articles, nextUrl: nextUrl };
}

async function scrapeArticle(job, done) {
  const start = Date.now();
  const url = job.attrs.data.url;

  console.log(`Scraping fte article ${url}`);

  const browser = await browserless.getBrowser();
  const page = await browser.newPage();

  await page.goto(url, browserless.defaultPageOpts);
  const data = await page.evaluate(getArticleData);
  
  const query = { sourceUrl: data.sourceUrl };
  const options = { upsert: true } 
  await Article.findOneAndUpdate(query, data, options);

  await page.close();
  await browser.close();

  const end = Date.now();
  console.log(`Scraped fte article in ${(end-start)/1000} seconds`);

  done();
}

function getArticleData() {
  var data = {};
  
  data['sourceUrl'] = window.location.href;
  data['updatedAt'] = Date.parse(document.querySelector('.datetime.updated').title);
  data['title'] = document.querySelector('.article-title').textContent.trim();

  try {
    const imageUrl = document.querySelector('.featured-picture > img').src;
    data['imageUrl'] = imageUrl.substring(0, imageUrl.indexOf('?'));
  } catch(err) {
    data['imageUrl'] = null;
  }
  
  var author = document.querySelector('.author').textContent;
  if (author == 'FiveThirtyEight') {
    data['author'] = null;
  } else {
    const matchResult = author.match(/.+by\W(.+)/i);
    if (matchResult) {
      data['author'] = matchResult[1];
    } else {
      data['author'] = author;
    }
  }
  
  data['tags'] = Array.from(document.querySelectorAll('.tag')).map((node) => {
    var href = node.href;
    var parts = href.split('/');
    var tag = parts[parts.length-2];
    return tag
  });

  const textNodes = Array.from(document.querySelectorAll('.entry-content > p'));
  textNodes.pop();
  data['text'] = textNodes.map((node) => node.textContent).join('\n\n');
  return data;
}
