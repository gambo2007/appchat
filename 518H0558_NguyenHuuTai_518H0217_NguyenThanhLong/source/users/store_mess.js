const moment = require('moment');

function formatOldMessage(username, text, time) {
    return {
        username,
        text,
        time,
    };
}

module.exports = formatOldMessage;


