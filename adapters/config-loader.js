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
  "sshextension": require("./configs/sshextension-config"),
  "ftp-simple": require("./configs/ftp-simple-config")
}

config.watcher = filewatcher();
config.startWatchers = function () {
  var _this = this;
  Object.keys(this.supported_configs).forEach(function (configname) {
    var adapter = _this.supported_configs[configname];
    if (!adapter.codesettings) {
      if (_this.exists(adapter.filename)) {
        _this.watcher.add(_this.getUserSettingsLocation(adapter.filename));
      }
    }
  });
}
config.getUserSettingsLocation = function (filename) {
  var folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.platform == 'linux' ? path.join(homedir, '.config') : '/var/local');
  if (/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1).toLowerCase() + folder.substring(1);
  return path.join(folder, "/Code/User/", filename ? filename : "");
}
config.exists = function (filename, local = false) {
  var result = true;
  if (fs.accessSync) {
    try {
      fs.accessSync(
        (!local) ? this.getUserSettingsLocation(filename) : filename
      );
    } catch (e) {
      result = false;
    }
  } else {
    result = fs.existsSync(
      (!local) ? this.getUserSettingsLocation(filename) : filename
    );
  }
  return result;
}
config.getConfigContents = function () {
  var _this = this;
  var merged_configs = [];
  var messages = [];
  Object.keys(this.supported_configs).forEach(function (configname) {
    var adapter = _this.supported_configs[configname];
    if (!adapter.codesettings) {
      if (_this.exists(adapter.filename)) {
        var filepath = _this.getUserSettingsLocation(adapter.filename);
        var content = fs.readFileSync(filepath).toString();
        var { result, configs } = adapter.formatter(content);
      }
      else {
        messages.push('Config file "' + _this.getUserSettingsLocation(adapter.filename) + '" not exists, it\'s skipped.');
        return;
      }
    }
    else {
      var { result, configs } = adapter.formatter();
    }
    if (result) {
      merged_configs = merged_configs.concat(configs);
      messages.push('Loaded ' + configs.length +' servers from "' + (!adapter.codesettings ? _this.getUserSettingsLocation(adapter.filename) : adapter.filename) + '"');
    }
    else {
      messages.push('Config file "' + _this.getUserSettingsLocation(adapter.filename) + '" is broken, it\'s skipped.');
    }
  });
  return {"merged_configs": merged_configs, "messages": messages};
}