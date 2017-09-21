# sshextension README

This extension allows you to open an SSH connection in the integrated terminal.
The extension was created in order to have access to the SSH in conjunction with the already available access to the FTP.  
For the server list, the extension configuration file ftp-simple is used.

## Features

Uses a ready-made server configuration file.  
The connection opens in a new instance of the integrated terminal.

## How to use

Open the Command Palette (usually `F1` or `Ctrl+Shift+P`)  
Select the command `Open SSH Connection`  
Select a server from the list

## Requirements

The work requires an extension [ftp-simple](https://marketplace.visualstudio.com/items?itemName=humy2833.ftp-simple).

## Extension Settings

For more information on configuring ftp-simple you can find out the page of [this extension](https://marketplace.visualstudio.com/items?itemName=humy2833.ftp-simple#user-content-config-setting-example).

## Known Issues

Works only with 'pageant'.
The list of servers is loaded ONLY during startup VSCode.

## Roadmap

Add the ability to work with a password or private key.  

## Release Notes

This is the first release in which the opening of the SSH session in the new instance of the VScode terminal is available.