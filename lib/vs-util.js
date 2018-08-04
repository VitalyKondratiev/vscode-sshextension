'use strict';
var vscode = require('vscode');
var fs = require('fs');
var os = require('os');
var homeDir = os.homedir();
var pathUtil = require('./path-util');
var commonUtil = require('./common-util');
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
o.getOutputChannel = function(name){
  return o.getOutputChannel.channels[name] ? o.getOutputChannel.channels[name] : o.getOutputChannel.channels[name] = vscode.window.createOutputChannel(name);
}
o.getOutputChannel.channels = {};

o.output = function(outputChannel, str){
  (typeof outputChannel === 'string' ? this.getOutputChannel(outputChannel) : outputChannel).appendLine("[" + commonUtil.getNow() + "] " + str);
}
o.msg = o.info = function(msg, btn, cb){
  var p = btn ? vscode.window.showInformationMessage(msg, btn) : vscode.window.showInformationMessage(msg);
  if(cb)
  {
    p.then(function(btn){
      cb(btn);
    });
  }
  return p;
};
o.error = function(msg, btn, cb){
  if(btn)  var p = vscode.window.showErrorMessage(msg, btn);
  else     var p = vscode.window.showErrorMessage(msg);
  if(cb)
  {
    p.then(function(btn){
      cb(btn);
    });
  }
  return p;
}
o.input = function(option, cb){
  var p = vscode.window.showInputBox(option);
  if(cb)
  {
    p.then(function(btn){
      // console.log(JSON.stringify(o));
      // if(!btn && option.value)
      // {
      //   if(typeof option.validateInput === 'function' && option.validateInput(option.value))
      //   {
      //     btn = option.value;
      //   }
      //   else btn = option.value;
      // }
      if(btn)cb(btn);
    });
  }
  return p;
};
o.pick = o.showQuickPick = function(data, option, cb){
  if(arguments.length === 2 && typeof option === 'function'){
    cb = option;
    option = undefined;
  } else if(typeof option === 'string'){
    option = {placeHolder:option};
  }
  var p = vscode.window.showQuickPick(data, option);
  if(cb) p.then(function(val){if(val)cb(val);});
  return p;
}