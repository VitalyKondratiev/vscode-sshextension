const crypto = require('crypto');

function Crypto() {
	this.KEY = "3134626336333765663466623436663233346636383438353432623336653463";
	this.IV = "6436346335333638333537633633323763333232633632633961346233653663"
}

Crypto.prototype =
	{
		encrypt: function (a, b, c) {
			if (!b) b = this.decodeHex(this.KEY);
			if (!c) c = this.decodeHex(this.IV);
			var d = crypto.createCipheriv('aes-128-cbc', new Buffer(b, 'hex'), new Buffer(c, 'hex'));
			return d.update(a, 'utf8', 'hex') + d.final('hex')
		}
		, decrypt: function (a, b, c) {
			if (!b) b = this.decodeHex(this.KEY);
			if (!c) c = this.decodeHex(this.IV);
			var d = crypto.createDecipheriv('aes-128-cbc', new Buffer(b, 'hex'), new Buffer(c, 'hex'));
			return d.update(a, 'hex', 'utf8') + d.final('utf8')
		}
		, hashing: function (a, b) {
			if (!b) b = "sha256";
			var c = crypto.createHash(b);
			c.update(a);
			return c.digest('hex')
		}
		, encodeBase64: function (a, b) {
			if (!b) b = "utf8";
			return new Buffer(a, b).toString('base64')
		}
		, decodeBase64: function (a, b) {
			if (!b) b = "utf8";
			return new Buffer(a, 'base64').toString(b)
		}
		, encodeHex: function (a, b) {
			if (!b) b = "utf8";
			return new Buffer(a, b).toString('hex')
		}
		, decodeHex: function (a, b) {
			if (!b) b = "utf8";
			return new Buffer(a, 'hex').toString(b)
		}
	};

function ConfigFormatter(content) {
	var c = new Crypto();
	var json = c.decrypt(content);
	var result = true;
	var configs_array = [];
	try {
		var parsed_array = JSON.parse(json);
		parsed_array.forEach(function (element) {
			if (element.type != "sftp") return;
			var config = {
				"name": element.name, // Used for serverlist
				"username": element.username,	// Used for authorization
				"password": element.password,	// Used for authorization (can be undefined)
				"host": element.host,	// Used for authorization
				"port": element.port,	// Used for authorization (can be undefined)
				"privateKey": element.privateKey,	// Used for authorization (can be undefined)
				"agent": element.agent,	// Used for authorization (can be undefined)
				"project": element.project,	// Used for fast button (can be undefined)
				"path": element.path, // Used for `cd` after start session (can be undefined)
			};
			configs_array.push(config);
		});
	}
	catch (e) {
		result = false;
	}
	return { "result": result, "configs": configs_array };
}

module.exports = ConfigFormatter;
