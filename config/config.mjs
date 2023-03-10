var env = process.env.NODE_ENV || "development";
var test = env === "test";

var config = (await import(`./environments/${env.toLowerCase()}.mjs`)).default;

if (!test) {
	if (process.env.PORT) {
		config.port = parseInt(process.env.PORT, 10);
	}

	if (process.env.MONGOLAB_URI) {
		config.mongo.uri = process.env.MONGOLAB_URI;
	}

	if (process.env.RAILS_SECRET) {
		config.secret_token = process.env.RAILS_SECRET;
	}

	if (process.env.STEAM_API_KEY) {
		config.steam.api_key = process.env.STEAM_API_KEY;
	}
}

export default config;
