const fs = require('fs');

module.exports = class Server {
  constructor(guildObject, settings = {}) {
    this.guild = guildObject;
    this.settings = settings;
  }

  importSettings() {
    // Import settings from file system using guilds id as file name
    //   If doesn't exist yet, use static options object => create file for that and import it!
  }
}
