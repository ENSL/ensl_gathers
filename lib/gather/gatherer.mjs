/*
 *	Implements Gatherer
 *
 *	Stores necessary information including:
 *	- user data
 *	- voting preferences
 *	- leader status
 *	- Team: "lobby" "alien" "marine"
 */ 

var MAX_MAP_VOTES = 2;
var MAX_SERVER_VOTES = 2;

class Gatherer {
	constructor(user) {
		this.leaderVote = null;
		this.mapVote = [];
		this.serverVote = [];
		this.confirm = false;
		this.id = user.id;
		this.user = user;
		this.leader = false;
		this.team = "lobby";
		this.regatherVote = false;
	}
	toggleMapVote(mapId) {
		if (this.mapVote.some(votedId => votedId === mapId)) {
			this.mapVote = this.mapVote.filter(voteId => voteId !== mapId);
			return;
		}
		this.mapVote.push(mapId);
		this.mapVote = this.mapVote.slice(this.mapVote.length - MAX_MAP_VOTES,
			this.mapVote.length);
	}
	toggleServerVote(serverId) {
		if (this.serverVote.some(votedId => votedId === serverId)) {
			this.serverVote = this.serverVote.filter(voteId => voteId !== serverId);
			return;
		}
		this.serverVote.push(serverId);
		this.serverVote = this.serverVote.slice(this.serverVote.length -
			MAX_SERVER_VOTES, this.serverVote.length);
	}
	voteForLeader(candidate) {
		if (candidate === null) {
			return this.leaderVote = null;
		}
		if (typeof candidate === 'number') {
			return this.leaderVote = candidate;
		}
		this.leaderVote = candidate.id;
	}
	voteRegather(vote) {
		if (vote !== undefined && typeof vote === 'boolean') {
			return this.regatherVote = vote;
		} else {
			this.regatherVote = true;
		}
		return this.regatherVote;
	}
};





export default Gatherer;