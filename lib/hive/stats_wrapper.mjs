// UserStatistics constructor parses Steam ISteamUserStats responses into 
// unified statistical interface

import { stat } from "fs";

// StatAttributes also provides default value as fallback
const StatAttributes = {
	level: (stats, apiValue) => { stats['level'] = apiValue },
	score: (stats, apiValue) => { stats['score'] = apiValue },
	skill: (stats, apiValue) => { stats['score'] = apiValue },
	td_rounds_won_player: (stats, apiValue) => { stats['player_wins'] = apiValue },
	td_rounds_won_commander: (stats, apiValue) => { stats['comm_wins'] = apiValue },
	skill: (stats, apiValue) => { stats['skill'] = apiValue },
	comm_skill: (stats, apiValue) => { stats['comm_skill'] = apiValue },
	td_total_time_player: (stats, apiValue) => { stats['player_time'] = apiValue },
	td_total_time_commander: (stats, apiValue) => { stats['commander_time'] = apiValue },
};
const NoopSetter = (_stats, _apiValue) => { };

class UserStatisticsWrapper {
	constructor(apiResponse = {}) {
		this["steamId"] = apiResponse.steamID;
		var stats = apiResponse.stats || [];
		stats.forEach(element => {
			var setter = StatAttributes[element.name] || NoopSetter;
			setter(this, element.value);
		});
	}
}

export default UserStatisticsWrapper;
