"use strict";

import { response } from "express";
import { resolve } from "path";
import fs from "fs";
import request from "request";
import UserStatisticsWrapper from "./stats_wrapper.mjs";
import config from "../../config/config.mjs"
const statFile = resolve("config/data/hive_stats.json")


class HiveClient {
	constructor(options) {
		if (!(this instanceof HiveClient)) {
			return new HiveClient(options);
		}
	}
	getUserStats(user, callback) {
		if (!user || !user.steam.id) {
			return callback(new Error("Invalid user instance supplied"));
		}
		if (process.env.NODE_ENV === 'production') {
			return request({
				url: `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?key=${config.steam.api_key}&steamid=${user.steam.id}&appid=4920`,
				json: true
			}, (error, _response, stats) => {
				if (response.statusCode !== 200) {
					return callback(error, null);
				}
				return callback(error, new UserStatisticsWrapper(stats["playerstats"]));
			});
		} else {
			var stats = JSON.parse(fs.readFileSync(statFile));
			return callback(null, new UserStatisticsWrapper(stats["playerstats"]));
		}

	}
}


export default HiveClient;
