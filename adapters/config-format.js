var format = function (element){
  var config = {
    "name": element.username + '@' + element.host, // Used for serverlist
    "username": element.username,	// Used for authorization
    "password": element.password,	// Used for authorization (can be undefined)
    "host": element.host,	// Used for authorization
    "port": element.port,	// Used for authorization (can be undefined)
    "privateKey": element.privateKey,	// Used for authorization (can be undefined)
    "agent": element.agent,	// Used for authorization (can be undefined)
    "project": element.project,	// Used for fast button (can be undefined)
    "path": element.path, // Used for `cd` after start session (can be undefined)
  };
  return config;
}

module.exports = format;