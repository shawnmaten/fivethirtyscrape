const Agenda = require('agenda');
const mongUrl = process.env.MONGO;

const agenda = new Agenda();
agenda.database(mongUrl);
agenda.maxConcurrency(1);
module.exports.agenda = agenda;

module.exports.wrapJob = function(func) {
  return async function(job, done) {
    try {
      await func(job, done);
    } catch(err) {
      done(err);
    }
  }
};
