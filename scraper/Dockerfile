FROM node:8-alpine

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init &&\
	mkdir -p /app &&\
    chown -R node:node /app
WORKDIR /app/
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]

COPY package.json package-lock.json src /app/
RUN npm install --production
USER node
CMD ["node", "index.js"]
