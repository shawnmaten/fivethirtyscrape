const moment = require('moment');

function parseMoment(input) {
  if (!input) {
    return null;
  }

  const parsed = moment(input, moment.ISO_8601);
	if (!parsed.isValid()) {
		return null;
	}

  return parsed;
};

module.exports.parseMoment = parseMoment;
