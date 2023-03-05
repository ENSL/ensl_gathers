"use strict";

var config = {
	port: 9000,
	mongo: {
		uri: "mongodb://localhost/swsgather_test"
	},
	secret_token: "SUPERSECRETFOO",
	session_store_name: "_ENSL_session_key_staging",
	ensl_rules_url: "http://www.ensl.org/articles/464",
	ensl_url: "http://staging.ensl.org/",
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