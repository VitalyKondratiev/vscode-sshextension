'use strict';
var fs = require('fs');
var os = require('os');
var homeDir = os.homedir();
var pathUtil = require('./path-util');
var o = {};
module.exports = o;

/*
homeDir - C:\Users\humy2833
process.env.APPDATA - C:\Users\humy2833\AppData\Roaming
process.env.HOME - undefined
 */

o.getConfigPath = function(filename){
  var folder = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.platform == 'linux' ? pathUtil.join(homeDir, '.config') : '/var/local');
  if(/^[A-Z]\:[/\\]/.test(folder)) folder = folder.substring(0, 1).toLowerCase() + folder.substring(1);
  return pathUtil.join(folder, "/Code/User/", filename ? filename : "");
}
o.existConfig = function(filename){
  var result = true;
  if(fs.accessSync){
    try{fs.accessSync(this.getConfigPath(filename));}catch(e){result=false;}
  }else{
    result = fs.existsSync(this.getConfigPath(filename));
  }
  return result;
}
o.getConfig = function(filename, pipe){
  var val;
  if(this.existConfig(filename))
  {
    var path = this.getConfigPath(filename);
    val = fs.readFileSync(path).toString();
    if(pipe) {
      try{
        val = pipe(val);
      }catch(e){throw e;}
    }
  }
  return val;
}