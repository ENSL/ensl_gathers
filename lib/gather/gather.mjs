/*
 *	Implements Gather Model
 *
 *	Gather States
 *	- Gathering
 *	- Election (Electing leaders)
 *	- Selection (Selecting teams)
 *	- Done
 *
 */
import Gatherer from "./gatherer.mjs";
import StateMachine from "javascript-state-machine";
import Server from "./server.mjs";

class Gather {
	constructor(options) {
		if (options === undefined)
			options = {};
		if (!(this instanceof Gather)) {
			return new Gather(options);
		}
		this.gatherers = [];
		let noop = () => { };
		this.onDone = (typeof options.onDone === 'function') ?
			options.onDone : noop;
		this.onEvent = (typeof options.onEvent === 'function') ?
			options.onEvent : noop;
		this.done = {
			time: null
		};

		this.teamSize = options.teamSize || 6;

		// Store cooldown times for gather leaves
		this.cooldown = {};
		this.COOLDOWN_TIME = 60 * 3; // 3 Minutes

		this.REGATHER_THRESHOLD = this.teamSize + 2;

		this.type = options.type || "classic";

		this.icon = options.icon || "gather icon";

		this.name = options.name || "Classic Gather";

		this.description = options.description || "No player requirements";

		this.election = {
			INTERVAL: 60000,
			startTime: null,
			timer: null
		};

		if (typeof options.membershipTest === 'function') {
			this.membershipTest = options.membershipTest.bind(this);
		}

		if (typeof options.serverMembershipTest === 'function') {
			this.serverMembershipTest = options.serverMembershipTest.bind(this);
		}

		this.initState();
	}
	lobbyFull() {
		return this.gatherers.length === (this.teamSize * 2);
	}
	leaderVotesFull() {
		return this.leaderVotes().length === (this.teamSize * 2);
	}
	resetState() {
		this.gatherers = [];
		this.cancelElectionCountdown();
		return this;
	}
	alienLeader() {
		return this.gatherers.reduce((acc, gatherer) => {
			if (gatherer.team === "alien" && gatherer.leader)
				acc.push(gatherer);
			return acc;
		}, []).pop();
	}
	marineLeader() {
		return this.gatherers.reduce((acc, gatherer) => {
			if (gatherer.team === "marine" && gatherer.leader)
				acc.push(gatherer);
			return acc;
		}, []).pop();
	}
	assignMarineLeader(id) {
		this.modifyGatherer({ id: id }, gatherer => {
			gatherer.leader = true;
			gatherer.team = "marine";
		});
	}
	assignAlienLeader(id) {
		this.modifyGatherer({ id: id }, gatherer => {
			gatherer.leader = true;
			gatherer.team = "alien";
		});
	}
	containsUser(user) {
		return this.gatherers.some(gatherer => {
			return gatherer.id === user.id;
		});
	}
	addUser(user) {
		if (this.containsUser(user))
			return null;
		let gatherer = new Gatherer(user);
		this.gatherers.push(gatherer);
		return gatherer;
	}
	removeUser(user) {
		this.gatherers = this.gatherers.filter(gatherer => user.id !== gatherer.id);
	}
	modifyGatherer(user, callback) {
		return this.gatherers
			.filter(gatherer => gatherer.id === user.id)
			.forEach(callback);
	}
	// 08/04/20 : 1-1-1-1-1 
	// 08/11/20 : 1-2-1-1-1 
	// 09/21/20 : 1-1-1-2-1 
	getPickingPattern() {
		const pickingPattern = [
			"marine",
			"alien",
			"marine",
			"alien",
			"alien",
			"marine",
			"alien",
			"marine",
			"alien",
			"marine",
			"alien",
			"marine",
		];

		return pickingPattern;
	}
	// Determines picking order of teams
	// Marine pick first
	pickingTurnIndex() {
		if (this.current !== 'selection')
			return null;

		const captainCount = 2;
		const alienCount = this.aliens().length;
		const marineCount = this.marines().length;
		const alreadyPickedCount = (marineCount + alienCount) - captainCount;
		const pickingPattern = this.getPickingPattern();

		const pickingTurn = alreadyPickedCount % pickingPattern.length;

		// prevent any team from growing beyond the team size limit
		if (marineCount >= this.teamSize) {
			return "alien";
		} else if (alienCount >= this.teamSize) {
			return "marine";
		}

		return pickingTurn;
	}
	// Moves player to marine
	// Optional `mover` argument which will check mover credentials to select
	// Credentials: Must be leader, must belong to team, must be turn to pick
	moveToMarine(user, mover) {
		if (this.marines().length >= this.teamSize)
			return;

		if (mover && this.containsUser(mover)) {
			let leader = this.getGatherer(mover);
			if (leader.team !== "marine" ||
				!leader.leader ||
				this.getPickingPattern()[this.pickingTurnIndex()] !== "marine")
				return;

			if (user && this.containsUser(user)) {
				if (this.getGatherer(user).team !== "lobby")
					return;
			}
		}

		this.modifyGatherer(user, gatherer => gatherer.team = "marine");
	}
	// Moves player to alien
	// Optional `mover` argument which will check mover credentials to select
	// Credentials: Must be leader, must belong to team, must be turn to pick
	moveToAlien(user, mover) {
		if (this.aliens().length >= this.teamSize)
			return;

		if (mover && this.containsUser(mover)) {
			let leader = this.getGatherer(mover);
			if (leader.team !== "alien" ||
				!leader.leader ||
				this.getPickingPattern()[this.pickingTurnIndex()] !== "alien")
				return;

			if (user && this.containsUser(user)) {
				if (this.getGatherer(user).team !== "lobby")
					return;
			}
		}

		return this.modifyGatherer(user, gatherer => gatherer.team = "alien");
	}
	moveToLobby(user) {
		this.modifyGatherer(user, gatherer => gatherer.team = "lobby");
	}
	retrieveGroup(team) {
		return this.gatherers.filter(gatherer => gatherer.team === team);
	}
	lobby() {
		return this.retrieveGroup("lobby");
	}
	aliens() {
		return this.retrieveGroup("alien");
	}
	marines() {
		return this.retrieveGroup("marine");
	}
	electionStartTime() {
		return (this.election.startTime === null) ?
			null : this.election.startTime.toISOString();
	}
	toJson() {
		return {
			name: this.name,
			icon: this.icon,
			description: this.description,
			type: this.type,
			gatherers: this.gatherers,
			servers: this.getServers(),
			state: this.current,
			pickingTurn: this.getPickingPattern()[this.pickingTurnIndex()],
			pickingTurnIndex: this.pickingTurnIndex(),
			pickingPattern: this.getPickingPattern().splice(0, this.getPickingPattern().length - 2),
			election: {
				startTime: this.electionStartTime(),
				interval: this.election.INTERVAL
			},
			teamSize: this.teamSize,
			done: {
				time: this.done.time
			},
			cooldown: this.cooldown
		};
	}
	toggleMapVote(voter, mapId) {
		this.modifyGatherer(voter, gatherer => gatherer.toggleMapVote(mapId));
	}
	toggleServerVote(voter, serverId) {
		this.modifyGatherer(voter, gatherer => gatherer.toggleServerVote(serverId));
	}
	// Returns an array of IDs representing votes for leaders
	leaderVotes() {
		let self = this;
		return self.gatherers
			.map(gatherer => gatherer.leaderVote)
			.filter(leaderId => typeof leaderId === 'number')
			.filter(leaderId => self.containsUser({ id: leaderId }));
	}
	voteForLeader(voter, candidate) {
		this.modifyGatherer(voter, gatherer => gatherer.voteForLeader(candidate));
	}
	getGatherer(user) {
		return this.gatherers
			.filter(gatherer => gatherer.id === user.id)
			.pop() || null;
	}
	regatherVotes() {
		let self = this;
		return self.gatherers.reduce((acc, gatherer) => {
			if (gatherer.regatherVote)
				acc++;
			return acc;
		}, 0);
	}
	// Initiates a timer which will push gather into next state
	startElectionCountdown() {
		let self = this;
		self.election.startTime = new Date();
		this.election.timer = setTimeout(() => {
			if (self.can("electionTimeout"))
				self.electionTimeout();
		}, self.election.INTERVAL);
	}
	cancelElectionCountdown() {
		clearTimeout(this.election.timer);
		this.election.timer = null;
		this.election.startTime = null;
	}
	applyCooldown(user) {
		if (user && typeof user.id === 'number') {
			let d = new Date();
			d.setUTCSeconds(d.getUTCSeconds() + this.COOLDOWN_TIME);
			this.cooldown[user.id] = d;
		}
	}
	needsToCoolOff(user) {
		if (user && typeof user.id === 'number') {
			let cooldownTime = this.cooldown[user.id];
			if (cooldownTime === undefined)
				return false;
			return cooldownTime > new Date();
		}
	}
	failsTest(user) {
		if (!this.membershipTest)
			return false;
		return !this.membershipTest(user);
	}
	getServers() {
		if (!this.serverMembershipTest)
			return Server.list;
		return Server.list.filter(this.serverMembershipTest);
	}
}

StateMachine.create({
	target: Gather.prototype,
	events: [
		{ name: "initState", from: "none", to: "gathering" },
		{ name: "addGatherer", from: "gathering", to: "election" },
		{ name: "selectLeader", from: "election", to: "selection" },
		{ name: "electionTimeout", from: "election", to: "selection" },
		{ name: "confirmSelection", from: "selection", to: "done" },
		{
			name: "removeGatherer",
			from: ["gathering", "election", "selection"],
			to: "gathering"
		},
		{
			name: "regather",
			from: ["gathering", "election", "selection"],
			to: "gathering"
		}
	],
	callbacks: {
		// Callbacks for events
		onafterevent: function () {
			this.onEvent.apply(this, [].slice.call(arguments));
		},

		// Gathering State
		onbeforeaddGatherer: function (event, from, to, user) {
			if (this.needsToCoolOff(user)) return false;
			if (this.failsTest(user)) return false;
			this.addUser(user);
			if (!this.lobbyFull()) {

				return false;
			}
		},

		// Election State
		onbeforeselectLeader: function (event, from, to, voter, candidate) {
			this.voteForLeader(voter, candidate);
			if (!this.leaderVotesFull()) return false;
		},

		onenterelection: function () {
			// discordBot.notifyChannel("Gather is starting! Pick your captains at https://gathers.ensl.org");
			// Setup timer for elections
			this.startElectionCountdown();
		},

		onleaveelection: function () {
			this.cancelElectionCountdown();
		},

		// Selection State
		onenterselection: function () {
			// Remove all leaders and teams
			this.gatherers.forEach(gatherer => {
				gatherer.leader = false;
				gatherer.team = "lobby";
			});

			// Assign leaders based on vote
			// 1st place alien comm
			// 2nd place marine comm
			let voteCount = {};
			this.gatherers.forEach(gatherer => { voteCount[gatherer.id] = 0 });
			this.leaderVotes().forEach(candidateId => { voteCount[candidateId]++ });
			let rank = [];
			for (let candidate in voteCount) {
				rank.push({ candidate: candidate, count: voteCount[candidate] });
			}
			rank.sort((a, b) => {
				return a.count - b.count;
			});
			this.assignAlienLeader(parseInt(rank.pop().candidate, 0));
			this.assignMarineLeader(parseInt(rank.pop().candidate, 0));
		},

		onleaveselection: function (event, from, to, voter, candidate) {
			if (event === "removeGatherer" || event === "regather") {
				this.gatherers.forEach(gatherer => {
					gatherer.team = "lobby";
				});
			}
		},

		onbeforeconfirmSelection: function (event, from, to, leader) {
			return (this.aliens().length === this.teamSize
				&& this.marines().length === this.teamSize);
		},

		// Remove gatherer event
		onbeforeremoveGatherer: function (event, from, to, user) {
			// Cancel transition if no gatherers have been removed
			let userCount = this.gatherers.length;
			this.removeUser(user);
			let userRemoved = userCount > this.gatherers.length;
			if (userRemoved && from !== 'gathering') this.applyCooldown(user);
			return userRemoved;
		},

		// Set gatherer vote & if threshold met, reset gather
		onbeforeregather: function (event, from, to, user, vote) {
			let self = this;
			self.modifyGatherer(user, (gatherer) => gatherer.voteRegather(vote));
			if (self.regatherVotes() >= self.REGATHER_THRESHOLD) {
				self.resetState();
				// discordBot.notifyChannel("@here Gather was reset! Rejoin to play!");
				return true;
			} else {
				return false;
			}
		},

		// On enter done
		onenterdone: function () {
			// discordBot.notifyChannel("Picking finished! Join the server!");
			this.done.time = new Date();
			this.onDone.apply(this, [].slice.call(arguments));
		}
	}
});

export default Gather;
