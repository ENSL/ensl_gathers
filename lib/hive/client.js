"use strict";

const { response } = require("express");
const path = require("path");
const { env } = require("process");
const request = require("request");
const logger = require("winston");
const UserStatisticsWrapper = require("./stats_wrapper");
const config = require(path.join(__dirname, "../../config/config"));
const statFile = path.join(__dirname, "../../config/data/hive_stats.json")


function HiveClient(options) {
	if (!(this instanceof HiveClient)) {
		return new HiveClient(options);
	}
}

HiveClient.prototype.getUserStats = function (user, callback) {
	if (!user || !user.steam.id) {
		return callback(new Error("Invalid user instance supplied"));
	}
	if (!process.env.NODE_ENV === 'production') {
		var stats = JSON.parse(fs.readFileSync(statFile));
		return callback(null, new UserStatisticsWrapper(stats["playerstats"]));
	} else {
		return request({
			url: `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?key=${config.steam.api_key}&steamid=${user.steam.id}&appid=4920`,
			json: true
		}, (error, _response, stats) => {
			if (response.statusCode !== 200) {
				return callback(error, null);
			}
			return callback(error, new UserStatisticsWrapper(stats["playerstats"]));
		});
	}

};

module.exports = HiveClient;
