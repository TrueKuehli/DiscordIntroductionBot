const IntroBot = require('./introBot');
const token = require('./token');

const bot = new IntroBot();
bot.login(token);
