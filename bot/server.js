const fs = require('fs');

const DEFAULTSETTINGS = {
  usersProcessed: [],
  usersSkipped: [],
  msgsIgnored: {},
};

const PRIORITY = [
  'TrueKuehli',
];

const DISALLOWEDROLES = [
  'bot',
  'pokecord',
];

const DISALLOWEDNAMES = [
  'IntroductionBot',
];

const ADMINS = [
  'TrueKuehli',
]

module.exports = class Server {
  constructor(guildObject, settings = {}) {
    this.guild = guildObject;
    this.settings = settings;
    this.userList = [];
    this.channel = null;
    this.ready = false;
    this.waiting = false;
  }

  importSettings() {
    if (!fs.existsSync('./settings/')) {
      fs.mkdirSync('./settings/');
    }

    let id = this.guild.id;
    try {
      let rawData = fs.readFileSync('./settings/' + id + '.json');
      this.settings = JSON.parse(rawData);
      if (!this.settings['usersProcessed']) this.settings['usersProcessed'] = [];
      if (!this.settings['usersSkipped']) this.settings['usersSkipped'] = [];
      if (!this.settings['msgsIgnored']) this.settings['msgsIgnored'] = {};
    } catch (err) {
      if (err.code == 'ENOENT') {
        this.settings = DEFAULTSETTINGS;
        fs.writeFileSync('./settings/' + id + '.json', JSON.stringify(this.settings));
        console.log('No settings file found. Creating it.')
      } else {
        console.log(err.toString());
      }

    }
  }

  saveSettings() {
    if (!fs.existsSync('./settings/')) {
      fs.mkdirSync('./settings/');
    }

    let id = this.guild.id;

    try {
      fs.writeFileSync('./settings/' + id + '.json', JSON.stringify(this.settings));
    } catch (err) {
      console.log('Failed to write save file: ', err.toString());
    }

  }

  updateUserList() {
    this.userList = [];
    for (let member of this.guild.members) {
      if (this.settings.usersProcessed.includes(member[0])) continue;
      if (this.settings.usersSkipped.includes(member[0])) continue;
      if (this.settings.msgsIgnored[member[0]] && this.settings.msgsIgnored[member[0]] > 5) continue;
      if (!PRIORITY.includes(member[1].user.username)) continue;
      if (DISALLOWEDNAMES.includes(member[1].user.username)) continue;
      if (member[1].roles.some((role) => DISALLOWEDROLES.includes(role.name.toLowerCase()))) continue;
      this.userList.push(member[1]);
    }

    for (let member of this.guild.members) {
      if (this.settings.usersProcessed.includes(member[0])) continue;
      if (this.settings.usersSkipped.includes(member[0])) continue;
      if (this.settings.msgsIgnored[member[0]] && this.settings.msgsIgnored[member[0]] > 5) continue;
      if (PRIORITY.includes(member[1].user.username)) continue;
      if (DISALLOWEDNAMES.includes(member[1].user.username)) continue;
      if (member[1].roles.some((role) => DISALLOWEDROLES.includes(role.name.toLowerCase()))) continue;
      this.userList.push(member[1]);
    }
  }

  getNextUser() {
    if (this.waiting) return;
    for (let user of this.userList) {
      if (user.presence.status == 'online') {
        this.currentUser = user;
        if (this.ready) {
          this.waiting = true;
          if (this.settings.msgsIgnored[this.currentUser.id]) {
            this.settings.msgsIgnored[this.currentUser.id]++;
          } else {
            this.settings.msgsIgnored[this.currentUser.id] = 1;
          }
          this.saveSettings();

          this.channel.send(`Hey ${this.currentUser}, warum stellst du dich nicht einmal vor?`);
        }
        return;
      }
    }
  }

  completed(user) {
    if (user.id == this.currentUser.id) {
      this.userList = this.userList.filter((usr) => {
        return usr.id != this.currentUser.id;
      });
      this.settings.usersProcessed.push(this.currentUser.id);
      this.saveSettings();

      this.currentUser = null;
      this.waiting = false;
    }
  }

  skip(cmdUser) {
    if (!ADMINS.includes(cmdUser.username)) {
      this.channel.send(`Diesen Befehl können nur Admins ausführen, ${cmdUser}.`);
      return false;
    } else {
      this.settings.usersSkipped.push(this.currentUser.id);
      this.saveSettings();

      this.currentUser = null;
      this.waiting = false;
      return true;
    }
  }

  getTextChannel() {
    let firstTextChannel;
    for (let channel of this.guild.channels) {
      channel = channel[1];
      if (channel.type != 'text') continue;

      firstTextChannel = firstTextChannel || channel;

      if (channel.name != 'introductions') continue;

      this.channel = channel;
      this.ready = true;
      return;
    }

    this.ready = false;
    firstTextChannel.send('Please create an #introductions text channel!')
  }
}
