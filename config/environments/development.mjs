var config = {
	port: 8000,
	mongo: {
		uri: "mongodb://db/swsgather_development"
	},
	secret_token: "",
	session_store_name: "_ENSL_session_key",
	ensl_url: "https://www.ensl.org",
	ensl_rules_url: "https://www.ensl.org/articles/464",
	steam: {
		api_key: '',
	}
};

export default config;