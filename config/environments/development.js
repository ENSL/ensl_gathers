"use strict";

var config = {
	port: 8000,
	mongo: {
		uri: "mongodb://db/swsgather_development"
	},
	secret_token: "",
	session_store_name: "_ENSL_session_key",
	ensl_url: "http://www.ensl.org/",
	ensl_rules_url: "http://www.ensl.org/articles/464",
	steam: {
		bot: {
			link: "http://steamcommunity.com/id/nslgathers",
			account_name: '',
			password: '',
		},
		api_key: '',
	}
};

module.exports = config;