const puppeteer = require('puppeteer-core');

const browserlessUrl = process.env.BROWSERLESS;

module.exports.getBrowser = async function() {
  return await puppeteer.connect({
    browserWSEndpoint: browserlessUrl,
    defaultViewport: {
      width: 1280,
      height: 800,
      deviceScaleFactor: 2
    }
  });
}

module.exports.defaultPageOpts = { waitUntil: 'domcontentloaded' };
