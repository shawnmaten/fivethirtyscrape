# FiveThirtyScrape

Working prototype of a serverless, dynamic site scraper using Zeit Now and Puppeteer.  

The goal of this project was to demonstrate a scraper that was sufficiently modern and met certain criteria. It needed to handle JS-heavy and SPA sites, be deployable to a PAAS or serverless environment, have a task queue and scheduling component, and scale down to free or nearly free. As an example, the news site FiveThirtyEight is scraped and turned it into a simple API, but the purpose of the project is to demonstrate the tools and services.

## Tools & Services Used
- [Zeit Now](https://zeit.co/now) (serverless Docker deployments)
- [mLab](https://mlab.com) (mongoDB as a service)
- [browserless](https://github.com/joelgriffith/browserless) (headless chrome as a service, self-hosted option)
- [puppeteer](https://github.com/GoogleChrome/puppeteer) (high-level api to control chrome)
- [agenda](https://github.com/agenda/agenda) (task queue, cron scheduling)

## Demo
You can view the output of a running demo at https://fivethirtyscrape.now.sh. It should return a JSON array of articles from the last week. New articles are scraped 3 times per day automatically.

## Considerations
I became interested in web crawlers and site scrapers about a year ago. I was intriqued by the idea to make content programatically accessible for sites that didn't offer APIs, and to then test out the content in different formats (native apps, different site designs, etc). These ideas turned into a rabbit hole of different options, and what I've made here is really the tenth or so incarnation.

The top considerations I ended up pivoting around were:
- Supporting JS-heavy and SPA sites
- Using desired tools but avoiding manual infrastructure
- Task queues and scheduling on serverless

## Usage, Configuration, & Deployment
The usage is very simple, scraped articles are returned as a JSON list from the root / endpoint. Configuration is done through the env variables in the docker-compose.yml (local deployment) and now.json (public deployment) files and Zeit Now secrets. You can leave everything as is for local deployment unless you need to change the port bindings. For public deployment to Zeit you need to set a few secrets.

For the browserless service we configure CONNECTION_TIMEOUT, MAX_CONCURRENT_SESSIONS, ENABLE_DEBUGGER, and TOKEN, which are explained in the browserless documentation. To deploy to Zeit you must set a secret value for "browserless-token" to restrict access to it. For the scraper service we configure BROWSERLESS and MONGO to point to the correct browserless and mongodb  instances. To deploy to Zeit you must set a secret value for "browserless-url" of the format "wss://browserless-url?token=some-token" and "mongo-url" of the format "mongodb://user:pass@mongodb-url/some-database".

A scrape of FiveThirtyEight will automatically start when you launch the scraper instance. It will scrape the last week of articles the first time and take a few minutes. Once articles are loaded into the database, subsequent runs will only scrape new articles. Agenda is set to run crawls at 6AM, 12PM, and 6PM CT.

### To Deploy Locally
Both services are setup to run inside Docker containers and Docker and Docker Compose are required. If you're unfamiliar with Docker or Compose, or need to install either, you can refer to the documentation [here](https://docs.docker.com/get-started/) and [here](https://docs.docker.com/compose/gettingstarted/).

```shell
docker-compose up
# Browserless debugger will be available at localhost:4000
# Articles endpiont will be available at localhost:3000
```

### To Deply to Zeit
This project was setup with [Zeit Now](https://zeit.co) in mind, but it should easily translate to other Docker environments. It will run under the free OSS plan. All that's needed is a (free) account and for the now CLI to be installed. To enable scheduled site scrapes, you will need to scale the scraper instance to always maintain 1 running instance (consuming 1/3 on the OSS plan). The browserless instance will scale to zero in between scrapes.

```shell
# Create secret with a reasonable access token for browserless
now secret add browserless-token some-random-token

# Deploy the browserless instance
# The --public option is required on the free plan, you can remove it for payed plans
now deploy --public ./browserless

# Create secrets for the browserless url (using the previous deployment) and mongo url
now secret add browserless-url wss://browserless-url?token=some-token
now secret add mongo-url mongodb://user:pass@mongodb-url/some-database

# Deploy the scraper instance
now deploy --public ./scraper

# For scheduled site scrapes, you must scale the scraper to always maintain 1 instance
# Use any region you want, but if you don't specify a region or specify all, 1 per region is created
# Agenda will handle multiple workers, but that's overkill in this case
now scale scraper-instance-url some-region 1 1

# Optionally you can give your scraper instance an alias
now alias set scraper-instance-url some-memorable-alias
```

### Tests
Using the Jest testing framework. All tests are under `scraper/src/__tests__`. Currently there are just a few unit tests for the health check endpoint.

To run tests:
```sh
docker-compose run --rm scraper npm run test
```

### Monitoring
There's a /health endpoint that checks the time of the last crawl and last article scraped. UptimeRobot is setup to monitor using this endpoint.

## Improvements
- It's a rough prototype, so code quality, testing, error handling
- Efficiency and scaling with headless chrome
	- We could scrape multiple pages per job to avoid some overhead
	- We could create multiple pages per single browser instance (but this runs into resource constraints)
	- We could use multiple browserless instances (but how to handle waiting and auto-scaling)
- Adapting to changes to Zeit platform, this uses v1 but v2 is in beta
