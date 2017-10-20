// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var vsUtil = require('./lib/vs-util');
var cryptoUtil = require('./lib/crypto-util');
var commandExistsSync = require('command-exists').sync;
var upath = require("upath");
var isPathInside = require('is-path-inside');
const CONFIG_NAME = "ftp-simple.json";

var outputChannel = null;
var fastOpenConnectionButton = null;
var fastOpenConnectionServerName = null;
var fastOpenConnectionProjectPath = null;
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
            openSSHConnection(item, false);
        })
    }));

    // Command palette 'SSH Port Forwarding'
    context.subscriptions.push(vscode.commands.registerCommand('sshextension.portForwarding', function () {
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
            createForwarding(item);
        })
    }));

    // Launch reload ftp-simple config if changed
    context.subscriptions.push(vscode.workspace.onWillSaveTextDocument(function (event) {
        var remoteTempPath = upath.normalize(event.document.fileName);
        var configTempPath = upath.normalize(vsUtil.getConfigPath() + 'ftp-simple-temp.json');
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
        openSSHConnection(fastOpenConnectionServerName, true);
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
function openSSHConnection(serverName, isFastConnection, forwardingArgs = null) {
    if (serverName === undefined) return false;
    var server = servers.find(function (element, index, array) { return element.name == this }, serverName);
    var terminal = terminals.find(function (element, index, array) {
        return element.name == this.terminalName && element.isForwarding == this.isForwarding
    }, {"terminalName" : serverName, "isForwarding": (forwardingArgs != null)});
    var terminalIsNew = true;
    var hasErrors = false;
    if (terminal === undefined) { // If the terminal does not exist
        vsUtil.output(outputChannel, "New terminal session initialization for '" + server.configuration.host + "'...");
        if (server.configuration.host === undefined || server.configuration.username === undefined) {
            vsUtil.output(outputChannel, "Check host or username for '" + server.configuration.host + "'");
            hasErrors = true;
        }
        var sshCommand = 'ssh ' + ((forwardingArgs != null) ? forwardingArgs + " " : "") + server.configuration.host + ' -l ' + server.configuration.username;
        // Add port if different from default port
        if (server.configuration.port !== undefined && server.configuration.port && server.configuration.port !== 22)
            sshCommand += ' -p ' + server.configuration.port;
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
            terminal = vscode.window.createTerminal(serverName + ((forwardingArgs != null) ? " (Forwarding)" : ""));
            terminals.push({ "name": serverName, "host": server.configuration.host, "terminal": terminal, "isForwarding": (forwardingArgs != null) });
            terminal.sendText(sshCommand);
            if (sshAuthorizationMethod == "byPass") {
                terminal.sendText(server.configuration.password);
            }
            if (vscode.workspace.getConfiguration('sshextension').openProjectCatalog && isFastConnection) {
                terminal.sendText("cd " + fastOpenConnectionProjectPath)
            }
            // If custom commands defined send it to terminal
            if (vscode.workspace.getConfiguration('sshextension').customCommands.length) {
                vscode.workspace.getConfiguration('sshextension').customCommands.forEach(function(command) {
                    terminal.sendText(command);
                }, this);
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

function createForwarding(serverName){
    function validateHostPort(port, domainReq = false){
        var portRegex = /^(?:(?:\S^|[^:])+:{1})?(?:[0-5]?\d{1,4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2]\d|6553[0-6]){1}$/;
        if (domainReq) portRegex = /^(?:(?:\S^|[^:])+:{1}){1}(?:[0-5]?\d{1,4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2]\d|6553[0-6]){1}$/;
        return (portRegex.test(port)) ? null : "Please enter a domain " + (!domainReq ? "(optional)  ": "") + "and port in range 0 - 65535 (e. g. localhost:9000" + (!domainReq ? " or 9000": "")+ ")";
    }
    function createForwardingArgs(option, firstAddress, secondAddress = null) {
        var forwardingArgs = option + " " + firstAddress;
        if (secondAddress != null)
            forwardingArgs += ":" + secondAddress;
        return forwardingArgs;
    }
    function toRecentlyUsed(recentlyUsedForwardings, forwardingArgs){
        if (recentlyUsedForwardings.indexOf(forwardingArgs) == -1) {
            vsUtil.msg("Want to save this forwarding in recently used?", "Yes").then(function(button){
                if (button == "Yes"){
                    recentlyUsedForwardings.push(forwardingArgs);
                    vscode.workspace.getConfiguration("sshextension").update("recentlyUsedForwardings", recentlyUsedForwardings, true)
                }
            });
        }
    }
    var types = {
        'Local to remote': {
            'firstAdressPrompt': "Type local address/port (e. g. localhost:9000 or 9000)",
            'secondAddressPrompt': "Type remote address (e. g. localhost:9000)",
            "firstDomainReq": false,
            'secondDomainReq': true,
            "option": "-L"
        },
        'Remote to local': {
            'firstAdressPrompt': "Type remote address/port (e. g. localhost:9000 or 9000)",
            'secondAddressPrompt': "Type local address (e. g. localhost:9000)",
            "firstDomainReq": false,
            'secondDomainReq': true,
            "option": "-R"
        },
        'SOCKS': {
            'firstAdressPrompt': "Type address for SOCKS (e. g. localhost:9000)",
            "firstDomainReq": true,
            "option": "-D"
        }
    }
    var recentlyUsedForwardings = vscode.workspace.getConfiguration("sshextension").recentlyUsedForwardings;
    if (recentlyUsedForwardings.length) {
        types['Recently used'] = {};
    }
    // Show select of types
    vsUtil.pick(Object.keys(types), 'Select forwarding type...').then(function (type) {
        if (type === undefined) return;
        // Show input for first address
        if (type != "Recently used"){
            vsUtil.input({"validateInput": (s) => {
                return validateHostPort(s, types[type].firstDomainReq)
            },"prompt": types[type].firstAdressPrompt, "ignoreFocusOut" : true}).then(function (firstAddress) {
                if (firstAddress === undefined || !firstAddress.length) return;
                if (type != "SOCKS"){
                    // Show input for second address
                    vsUtil.input({"validateInput": (s) => {
                        return validateHostPort(s, types[type].secondDomainReq)
                    }, "prompt": types[type].secondAddressPrompt, "ignoreFocusOut" : true}).then(function (secondAddress) {
                        if (secondAddress === undefined || !secondAddress.length) return;
                        var forwardingArgs =  createForwardingArgs(types[type].option, firstAddress, secondAddress);
                        openSSHConnection(serverName, false, forwardingArgs);
                        toRecentlyUsed(recentlyUsedForwardings, forwardingArgs);
                    });
                }
                else {
                    var forwardingArgs = createForwardingArgs(types[type].option, firstAddress);
                    openSSHConnection(serverName, false, forwardingArgs);
                    toRecentlyUsed(recentlyUsedForwardings, forwardingArgs);
                }
            });
        }
        else {
            vsUtil.pick(recentlyUsedForwardings, 'Select forwarding arguments from recently used...').then(function (forwardingArgs) {
                if (forwardingArgs) return;
                openSSHConnection(serverName, false, forwardingArgs);
            });
        }
    });
}

// This method try to find server with project that contains file
function getProjectByFilePath(filePath) {
    var projectPath = null;
    // Get path to edited file with fixed drive letter case
    var openedFileName = upath.normalize(filePath);
    openedFileName = openedFileName.replace(/\w:/g, function (g) { return g.toLowerCase() })
    // Find the server that has the project containing this file
    var server = servers.find(function (element, index, array) {
        // If the server does not have any projects, go to the next
        if (element.configuration.project === undefined) return false;
        var thisServerMapped = false;
        Object.keys(element.configuration.project).forEach(function (item) {
            // Get project path with fixed drive letter case
            var serverProjectPath = upath.normalize(item);
            serverProjectPath = item.replace(/\w:/g, function (g) { return g.toLowerCase() });
            thisServerMapped = isPathInside(openedFileName, serverProjectPath);
            if (thisServerMapped) {
                projectPath = element.configuration.project[item];
            }
        }, this);
        return thisServerMapped;
    }, openedFileName);
    return { "server" : server, "projectPath" : projectPath };
}

function manageFastOpenConnectionButtonState() {
    var mappedServer = undefined;
    if (vscode.window.activeTextEditor != undefined) {
        var project = getProjectByFilePath(vscode.window.activeTextEditor.document.fileName);
        fastOpenConnectionProjectPath = project.projectPath;
        mappedServer = project.server;
    }
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