const fs = require('fs');

const DEFAULTSETTINGS = {
  usersProcessed: [],
}

const PRIORITY = [
  'TrueKuehli'
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
      if (!PRIORITY.includes(member[1].user.username)) continue;
      if (member[1].user.username == 'IntroductionBot') continue;
      this.userList.push(member[1]);
    }

    for (let member of this.guild.members) {
      if (this.settings.usersProcessed.includes(member[0])) continue;
      if (PRIORITY.includes(member[1].user.username)) continue;
      if (member[1].user.username == 'IntroductionBot') continue;
      if (member[1].roles.some((role) => role.name.toLowerCase() == 'bot')) continue;
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
