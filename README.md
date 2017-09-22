# About SSHExtension

[![Latest Release](https://vsmarketplacebadge.apphb.com/version/kondratiev.sshextension.svg)](https://marketplace.visualstudio.com/items?itemName=kondratiev.sshextension)
[![Installs](https://vsmarketplacebadge.apphb.com/installs-short/kondratiev.sshextension.svg)](https://marketplace.visualstudio.com/items?itemName=kondratiev.sshextension)

This extension allows you to open an SSH connection in the integrated terminal.
The extension was created in order to have access to the SSH in conjunction with the already available access to the FTP.  
For the server list, the extension configuration file ftp-simple is used.

## Features

Uses a ready-made server configuration file.  
The connection opens in a new instance of the integrated terminal.

## How to use

Open the Command Palette (usually `F1` or `Ctrl+Shift+P`). 
Select the command `Open SSH Connection`.
Select a server from the list.  
  
To add a server, see the ftp-simple configuration file.

## Requirements

The work requires an extension [ftp-simple](https://marketplace.visualstudio.com/items?itemName=humy2833.ftp-simple).  
  
You should still have an ssh agent, not necessarily that it is available in the entire system. it is important that it is accessible from the integrated VSCode terminal.

## Extension Settings

For more information on configuring ftp-simple you can find out the page of [this extension](https://marketplace.visualstudio.com/items?itemName=humy2833.ftp-simple#user-content-config-setting-example).

## Known Issues

Works only with 'pageant' and ssh private keys.

## Roadmap

Add the option to customize the extension. 
Add the ability to work with a password.  
Add the ability to work with an external terminal.

## Feedback

I want to make a really useful extension, if you find a bug, please create an issue at github.  
If you have suggestions to the functional, then write to the same.  
And also if it's not difficult for you, leave a comment in the marketplace.