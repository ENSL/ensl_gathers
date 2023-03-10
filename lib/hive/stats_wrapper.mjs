// UserStatistics constructor parses Steam ISteamUserStats responses into 
// unified statistical interface

import { stat } from "fs";

// StatAttributes also provides default value as fallback
const StatAttributes = {
	level: (stats, apiValue) => { stats['level'] = apiValue },
	score: (stats, apiValue) => { stats['score'] = apiValue },
	skill: (stats, apiValue) => { stats['skill'] = apiValue },
	skill_offset: (stats, apiValue) => { stats['skill_offset'] = apiValue },
	comm_skill: (stats, apiValue) => { stats['comm_skill'] = apiValue },
	comm_skill_offset: (stats, apiValue) => { stats['comm_offset'] = apiValue },
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
