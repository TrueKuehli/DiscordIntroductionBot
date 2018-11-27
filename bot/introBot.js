const Discord = require('discord.js');
const Server = require('./server');

module.exports = class IntroBot extends Discord.Client {
  constructor() {
    super();
    this.serverList = {};

    this.on('ready', () => this.init());
    this.on('message', (msg) => this.handleMessage(msg));
    this.on('channelCreate', (channel) => {
      let server = this.serverList[channel.guild.id];
      if (server.ready) return;
      if (channel.type != 'text') return;
      if (channel.name != 'introductions') return;

      server.ready = true;
      server.channel = channel;
      server.updateUserList();
      server.getNextUser();
    });

    this.on('presenceUpdate', (oldMember, newMember) => {
      let server = this.serverList[newMember.guild.id];
      if (newMember.presence.status == 'online') {
        if (server.waiting) return;
        server.updateUserList();
        server.getNextUser();
      } else if (newMember.presence.status == 'offline') {
        if (!server.waiting) return;
        if (server.currentUser.id == newMember.user.id) {
          server.waiting = false;
          server.getNextUser();
        }
      }
    });

    this.on('error', () => {
      this.destroy().then(() => this.login());
    });
  }

  init() {
    for (let guildAndId of this.guilds) {
      const id = guildAndId[0];
      const guild = guildAndId[1];
      if (guild.available) {
        let server = new Server(guild);
        server.importSettings();
        server.getTextChannel();
        server.updateUserList();
        server.getNextUser();

        this.serverList[guild.id] = server;
      }
    }
  }

  handleMessage(msg) {
    let server = this.serverList[msg.guild.id];

    if (msg.author.id != server.currentUser.id) return;
    if (msg.content.includes('!update')) {
      server.updateUserList();
    }
    if (msg.content.includes('!next')) {
      server.completed(server.currentUser)
      server.getNextUser();
    }
    if (msg.content.includes('!skip')) {
      if (server.skip(msg.author)) server.getNextUser();
    }
  }
}
