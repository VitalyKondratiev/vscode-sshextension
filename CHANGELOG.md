# Change Log
All notable changes to the "sshextension" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 0.4.1 (Patch)
- Small code impovements

## 0.4.0 (Features)
- Added "customCommands" parameter for each server in list
- All custom commands send to terminal in one time

## 0.3.1 (Patch)
- Fixed "tsserver was deleted" error.  

## 0.3.0 (Features)
- Added ability to add server configurations in VSCode settings file
- Completely rewritten servers configuration load system
- Added option for customize pick lists

## 0.2.1 (Features)
- Added option for multiple connections at the same time

## 0.2.0 (Features)
- Added feature for SSH port forwarding
- Fix configuration key - "sshextension.openProjectCatalog", if set to true, on opening connection from command palette, after ssh opened connecton executes "cd null" command

## 0.1.2 (Features)
- Added the ability to use different port in ssh connections (thx [eduardbadillo](https://github.com/eduardbadillo))
- Added user configuration options for extension
- Added the ability to open project directory after SSH session start (option)
- Added the ability to launch commands after SSH session start (option)

## 0.1.1 (Patch)
- Fixed button for quickly opening SSH on Windows, if project path been defined as Unix-path
- Removed/replaced some Node.js modules, used in extension

## 0.1.0 (Features)
- Added log entries for config errors on terminal creating
- Added the ability to work with a password from configuration file

## 0.0.7 (Patch)
- Fixed the appearance of a button for quickly opening SSH when VSCode was first launched and a new project was opened
- Added log entries for creating and killing terminals

## 0.0.6 (Features)
- In the status bar, a quick opening button is added to SSH if the open file is in the project that is associated with the server

## 0.0.5 (Features)
- Added name for instance of integrated terminal
- Added check for the existence of the ssh utility on your machine
- For an already open server, a new instance of the integrated terminal is not created
- Fixed loading of the ftp-simple configuration file when it was changed

## 0.0.4 (Patch)
- Fixed bug with no ftp-simple.json file

## 0.0.3 (Patch)
- The required dependencies of Node.js in production have been added
- Added extension icon

## 0.0.2 (Release, non-functional changes)
- Fixed minimal supported version of VSCode
- Fixed a short description
- The list of changes has been moved to CHANGELOG.md

## [Unreleased]
- Initial release
