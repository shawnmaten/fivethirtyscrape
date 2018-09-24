const Agenda = require('agenda');
const mongUrl = process.env.MONGO;

const agenda = new Agenda();
agenda.database(mongUrl);
agenda.maxConcurrency(1);

module.exports = agenda;