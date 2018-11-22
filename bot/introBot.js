const Discord = require('discord.js');
const Server = require('./server');

module.exports = class IntroBot extends Discord.Client {
  constructor() {
    super();
    this.serverList = [];

    this.on('ready', () => this.init());
    this.on('message', (msg) => this.handleMessage(msg));
  }

  init() {
    for (let guild of this.guilds) {
      if (guild.available) {
        let server = new Server(guild);
        server.importSettings();

        this.serverList.push(server)
      }
    }
  }

  handleMessage(msg) {
    // If message includes !introduction,
    // wait a bit and then ask someone else to introduce themselves
  }
}
