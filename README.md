# About SSHExtension

[![Join the chat at https://gitter.im/Vitalykondratiev/vscode-sshextension](https://badges.gitter.im/Vitalykondratiev/vscode-sshextension.svg)](https://gitter.im/Vitalykondratiev/vscode-sshextension?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

[![Latest Release](https://vsmarketplacebadge.apphb.com/version/kondratiev.sshextension.svg)](https://marketplace.visualstudio.com/items?itemName=kondratiev.sshextension)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/kondratiev.sshextension.svg)](https://marketplace.visualstudio.com/items?itemName=kondratiev.sshextension)

This extension allows you to open an SSH connection in the integrated terminal.
The extension was created in order to have access to the SSH in conjunction with the already available access to the FTP.  
For the server list, the extension configuration file ftp-simple is used.

## Features

Uses a ready-made server configuration file.  
The connection opens in a new instance of the integrated terminal.

## How to use

### Open terminal from server list
Open the Command Palette (usually `F1` or `Ctrl+Shift+P`).  
Select the command `Open SSH Connection`.  
Select a server from the list.

![Demo Open connection from list](./images/open_connection_from_list.gif)

### Fast open terminal
- Open workspace with project mapped to server
- Open any project file or go to already opened editor tab  
- Click on "Open SSH on \<servername>" button

![Demo Open connection from list](./images/open_fast_connection.gif)

To add a server, see the [ftp-simple configuration file](https://marketplace.visualstudio.com/items?itemName=humy2833.ftp-simple#user-content-config-setting-example).

## Requirements

The work requires an extension [ftp-simple](https://marketplace.visualstudio.com/items?itemName=humy2833.ftp-simple).  
  
You should still have an ssh agent, not necessarily that it is available in the entire system. it is important that it is accessible from the integrated VSCode terminal.

## Extension Settings

For more information on configuring ftp-simple you can find out the page of [this extension](https://marketplace.visualstudio.com/items?itemName=humy2833.ftp-simple#user-content-config-setting-example).

## Roadmap

Add the option to customize the extension.  
Add the ability to work with an external terminal.  
Open SSH connections in Putty  
And a few more ~~secret (before their release)~~ features... )

## Feedback

I want to make a really useful extension, if you find a bug, please create an issue at github.  
If you have suggestions to the functional, then write to the same.  
And also if it's not difficult for you, leave a comment in the marketplace.