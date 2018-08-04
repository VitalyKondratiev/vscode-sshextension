const path = require('path');
const homedir = require('os').homedir();
const fs = require('fs');
const filewatcher = require('filewatcher');
const config = {};
module.exports = config;

path.join = (function (_super) {
  return function () {
    return path.normalize(_super.apply(this, arguments)).replace(/\\/g, '/');
  }
})(path.join);

config.supported_configs = {
  "ftp-simple.json": require("./configs/ftp-simple-config")
}

config.watcher = filewatcher();
config.getUserSettingsLocation = function (filename) {
  var folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.platform == 'linux' ? path.join(homedir, '.config') : '/var/local');
  if (/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1).toLowerCase() + folder.substring(1);
  return path.join(folder, "/Code/User/", filename ? filename : "");
}
config.exists = function (filename) {
  var result = true;
  if (fs.accessSync) {
    try {
      fs.accessSync(
        this.getUserSettingsLocation(filename)
      );
    } catch (e) {
      result = false;
    }
  } else {
    result = fs.existsSync(
      this.getUserSettingsLocation(filename)
    );
  }
  return result;
}
config.getConfigContents = function () {
  var _this = this;
  var merged_configs = [];
  var messages = [];
  Object.keys(this.supported_configs).forEach(function (filename) {
    if (_this.exists(filename)) {
      var filepath = _this.getUserSettingsLocation(filename);
      var content = fs.readFileSync(filepath).toString();
      var formatter = _this.supported_configs[filename];
      var { result, configs } = formatter(content);
      if (result) {
        merged_configs = merged_configs.concat(configs);
        messages.push('Loaded ' + configs.length +' servers from "' + _this.getUserSettingsLocation(filename) + '"');
      }
      else {
        messages.push('Config file "' + _this.getUserSettingsLocation(filename) + '" is broken, it\'s skipped.');
      }
    }
    else {
      messages.push('Config file "' + _this.getUserSettingsLocation(filename) + '" not exists, it\'s skipped.');
    }
  });
  return {"merged_configs": merged_configs, "messages": messages};
}