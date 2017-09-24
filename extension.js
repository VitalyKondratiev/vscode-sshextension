// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var vsUtil = require('./lib/vs-util');
var cryptoUtil = require('./lib/crypto-util');
var pathUtil = require('./lib/path-util');
var commandExistsSync = require('command-exists').sync;
var trueCasePathSync = require('true-case-path');
var pathIsInside = require("path-is-inside");
const CONFIG_NAME = "ftp-simple.json";

var outputChannel = null;
var fastOpenConnectionButton = null;
var fastOpenConnectionServerName = null;
var servers = [];
var terminals = [];

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    initExtension();

    // Command palette 'Open SSH Connection'
    context.subscriptions.push(vscode.commands.registerCommand('sshextension.openConnection', function () {
        if (!servers.length) {
            vscode.window.showInformationMessage("You don't have any servers");
            return;
        }
        // Create list of server names
        var names = [];
        servers.forEach(function (element) {
            names.push(element.name);
        }, this);
        // Show Command Palette with server list of servers
        vsUtil.pick(names, 'Select the server to connect...').then(function (item) {
            openSSHTerminal(item);
        })
    }));
    // Launch reload ftp-simple config if changed
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(function (event) {
        var remoteTempPath = pathUtil.normalize(event.document.fileName);
        var configTempPath = pathUtil.normalize(vsUtil.getConfigPath() + 'ftp-simple-temp.json');
        if (configTempPath != remoteTempPath) return;
        loadServerList(event.document.getText());
    }));
    // If terminal closed 
    context.subscriptions.push(vscode.window.onDidCloseTerminal(function (event) {
        var terminal = terminals.find(function (element, index, array) {
            return element.terminal._id == this._id
        }, event);
        if (terminal === undefined) return;
        terminals.shift(terminal);
        vsUtil.output(outputChannel, "A terminal with a session for '" + terminal.host + "' has been killed.");
    }));
    // If the edited file is in the project directory
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(function (event) {
        manageFastOpenConnectionButtonState();
    }));
    context.subscriptions.push(vscode.commands.registerCommand('sshextension.fastOpenConnection', function (c) {
        openSSHTerminal(fastOpenConnectionServerName);
    }));
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

// Loads an object that contains a list of servers in JSON format
function loadFtpSimpleConfig() {
    var result = true;
    var json = vsUtil.getConfig(CONFIG_NAME);
    try {
        json = cryptoUtil.decrypt(json);
        json = JSON.parse(json);
    } catch (e) {
        vsUtil.error("Check Simple-FTP config file syntax.");
        result = false;
    }
    return { "result": result, "json": json };
}

// Function initializes an array of servers from a string or JSON object
function loadServerList(source) {
    var serversConfig = null;
    if (typeof (source) === "string") { // If the parameter is a string
        var parsedSource = JSON.parse(source);
        serversConfig = { "result": parsedSource !== undefined, "json": parsedSource };
    }
    else { // If the parameter is a JSON object
        serversConfig = source;
    }
    if (serversConfig.result) {
        servers = [];
        serversConfig.json.forEach(function (element) {
            if (element.type != "sftp") return;
            var server = { "name": element.name, "configuration": element };
            servers.push(server);
        }, this);
        vsUtil.output(outputChannel, "Loaded " + servers.length + " server(s)");
    }
    else {
        vsUtil.output("Unable to load server list, check Simple-FTP configuration file.");
        return false;
    }
    return true;
}

// Function checks for ssh utilities
function checkSSHExecutable() {
    var checkResult = commandExistsSync('ssh');
    if (checkResult) {
        vsUtil.output(outputChannel, "Find ssh on your system.");
    } else {
        vsUtil.output(outputChannel, "Did not find ssh on your system.");
    }
    vsUtil.output(outputChannel, "If you use a third-party terminal, then make sure that there is an SSH utility.");
    return checkResult;
}

// This method creates a terminal for the server by its name
function openSSHTerminal(serverName) {
    if (serverName === undefined) return false;
    var server = servers.find(function (element, index, array) { return element.name == this }, serverName);
    var terminal = terminals.find(function (element, index, array) {
        return element.name == this
    }, serverName);
    var terminalIsNew = true;
    var hasErrors = false;
    if (terminal === undefined) { // If the terminal does not exist
        vsUtil.output(outputChannel, "New terminal session initialization for '" + server.configuration.host + "'...");
        if (server.configuration.host === undefined || server.configuration.username === undefined) {
            vsUtil.output(outputChannel, "Check host or username for '" + server.configuration.host + "'");
            hasErrors = true;
        }
        var sshCommand = 'ssh ' + server.configuration.host + ' -l ' + server.configuration.username;
        var sshAuthorizationMethod = "byPass";
        // Authorization through an agent
        if (server.configuration.agent !== undefined && server.configuration.agent)
            sshAuthorizationMethod = "agent";
        // Authorization by private key
        if (server.configuration.privateKey !== undefined && server.configuration.privateKey) {
            sshCommand += ' -i "' + server.configuration.privateKey + '"';
            sshAuthorizationMethod = "byPrivateKey";
        }
        if (!hasErrors) {
            terminal = vscode.window.createTerminal(serverName);
            terminals.push({ "name": serverName, "host": server.configuration.host, "terminal": terminal });
            terminal.sendText(sshCommand);
            if (sshAuthorizationMethod == "byPass") {
                terminal.sendText(server.configuration.password);
            }
        }
    }
    else { // If the terminal instance was found
        terminal = terminal.terminal;
        terminalIsNew = false;
    }
    if (!hasErrors) {
        terminal.show();
        vsUtil.output(outputChannel, "A terminal with a session for '" + server.configuration.host + "' has been " + ((terminalIsNew) ? "created and displayed" : "displayed."));
    }
    else {
        vsUtil.output(outputChannel, "A terminal with a session for '" + server.configuration.host + "' has been not started, because errors were found.");
        vsUtil.error("Terminal has been not started, check output for more info.", "Check output", function () {
            outputChannel.show();
        });
    }
    return hasErrors;
}

// This method try to find server with project that contains file
function getServerByFilePath(filePath) {
    // Get path to edited file with fixed drive letter case
    var openedFileName = trueCasePathSync(pathUtil.normalize(filePath));
    openedFileName = openedFileName.replace(/\w:/g, function (g) { return g.toLowerCase() })
    // Find the server that has the project containing this file
    var server = servers.find(function (element, index, array) {
        // If the server does not have any projects, go to the next
        if (element.configuration.project === undefined) return false;
        var thisServerMapped = false;
        Object.keys(element.configuration.project).forEach(function (item) {
            // Get project path with fixed drive letter case
            var serverProjectPath = trueCasePathSync(pathUtil.normalize(item));
            serverProjectPath = item.replace(/\w:/g, function (g) { return g.toLowerCase() })
            thisServerMapped = pathIsInside(openedFileName, serverProjectPath);
        }, this);
        return thisServerMapped;
    }, openedFileName);
    return server;
}

function manageFastOpenConnectionButtonState() {
    var mappedServer = undefined;
    if (vscode.window.activeTextEditor != undefined)
        mappedServer = getServerByFilePath(vscode.window.activeTextEditor.document.fileName)
    // If the server is found then show the button and save the server name
    if (mappedServer !== undefined) {
        fastOpenConnectionButton.text = "$(terminal) Open SSH on " + mappedServer.configuration.name;
        fastOpenConnectionButton.show();
        fastOpenConnectionServerName = mappedServer.configuration.name;
    }
    // Otherwise hide the button
    else {
        fastOpenConnectionButton.hide();
    }
}

// Initialize extension
function initExtension() {
    outputChannel = vsUtil.getOutputChannel("ssh-extension");
    checkSSHExecutable();
    loadServerList(loadFtpSimpleConfig());
    fastOpenConnectionButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    fastOpenConnectionButton.command = "sshextension.fastOpenConnection";
    manageFastOpenConnectionButtonState();
    return true;
}

exports.deactivate = deactivate;