"use strict";

var config = {
	port: 80,
	mongo: {
		uri: "" // Set using MONGOLAB_URI
	},
	secret_token: "",
	session_store_name: "_ENSL_session_key",
	ensl_url: "https://www.ensl.org/",
	ensl_rules_url: "https://www.ensl.org/articles/464",
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