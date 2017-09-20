// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var vsUtil = require('./lib/vs-util');
var cryptoUtil = require('./lib/crypto-util');
const CONFIG_NAME = "ftp-simple.json";
var outputChannel = null;

var servers = null;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    outputChannel = vsUtil.getOutputChannel("ssh-extension");
    var config = initConfig();
    if (config.result) {
        servers = [];
        config.json.forEach(function (element) {
            if (element.type != "sftp") return;
            var server = { "name": element.name, "configuration": element };
            servers.push(server);
        }, this);
        vsUtil.output(outputChannel, "SSHExtension succesfully started and loaded " + servers.length + " server(s)");
    }

    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    var disposable = vscode.commands.registerCommand('extension.openConnection', function () {
        // The code you place here will be executed every time your command is executed
        if (!servers.length) {
            vscode.window.showInformationMessage("You don't have any servers");
            return;
        }
        var names = [];
        servers.forEach(function (element) {
            names.push(element.name);
        }, this);
        vsUtil.pick(names, 'Select the server to connect...').then(function (item) {
            if (item === undefined) return;
            var server = servers.find(function (element, index, array) { return element.name == this }, item);
            var term = vscode.window.createTerminal();
            term.sendText('ssh ' + server.configuration.host + ' -l ' + server.configuration.username);
            term.show();
        })
    });

    context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

function getConfig() {
    var json = {};
    var config = initConfig();
    if (config.result) {
        json = config.json;
    }
    return json;
}

function initConfig() {
    var result = true;
    var json = vsUtil.getConfig(CONFIG_NAME);
    try {
        json = cryptoUtil.decrypt(json);
        json = JSON.parse(json);
    } catch (e) {
        vsUtil.error("Check Simple-FTP config file syntax.");
        result = false;
    }
    return { result: result, json: json };
}

exports.deactivate = deactivate;