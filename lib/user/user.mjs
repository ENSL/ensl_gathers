/*
 *	Implements User Model
 *
 */

import _ from "lodash";
import async from "async"
import mongoose from "mongoose";
import SteamConvert from "steamidconvert";
import EnslClient from "../ensl/client.mjs";
import HiveClient from "../hive/client.mjs";
import winston from "winston";

const Profile = mongoose.model("Profile");
const steam = new SteamConvert();
const enslClient = new EnslClient();
const hiveClient = new HiveClient();

class User {
	constructor(user) {
		this.id = user['id'];
		this.online = true;
		this.username = user['username'];
		this.country = user['country'];
		this.time_zone = user['time_zone'];
		this.avatar = enslClient.getFullAvatarUri(user['avatar']);
		this.admin = user['admin'];
		this.moderator = user['moderator'];
		this.team = user['team'];
		this.bans = user['bans'];
		if (user['steam']) {
			this.steam = {
				id: steam.convertTo64(user['steam']['id']),
				url: user['steam']['url'] || null,
				nickname: user['steam']['nickname'] || null
			};
		} else {
			this.steam = {
				id: null,
				url: null,
				nickname: null
			};
		}
		this.profile = null;
		this.hive = {
			id: null
		};


	}
	static find(id, callback) {
		enslClient.getUserById({
			id: id
		}, (error, response, body) => {
			if (error)
				return callback(error);
			if (response.statusCode !== 200)
				return callback(new Error("Unable to auth user against API"));
			let user = new User(body);
			async.parallel([
				// Retrieve or create user profile from local store
				callback => {
					Profile.findOrCreate(user, (error, profile) => {
						if (error)
							return callback(error);
						user.profile = profile.toJson();
						return callback(null, profile);
					});
				},
				callback => {
					hiveClient.getUserStats(user, (error, stats) => {
						if (error || !stats || stats.steamId === null) {
							winston.error(`Getting UserStats failed: ${error}`)
							return callback(error, null);
						}
						_.assign(user.hive, stats);
						return callback(null, stats);
					});
				}
			], function (error, result) {
				if (error)
					return callback(error);
				return callback(null, user);
			});
		});
	}
	isChatAdmin() {
		return this.admin || this.moderator;
	}
	isGatherAdmin() {
		return this.admin || this.moderator;
	}
	isUserAdmin() {
		return this.admin;
	}
	updateProfile(data, callback) {
		let self = this;
		Profile.findOne({ userId: self.id }, (error, profile) => {
			if (error)
				return callback(error);
			allowedAttributes.forEach(function (attr) {
				if (data[attr] !== undefined)
					profile[attr] = data[attr];
			});
			if (data.abilities) {
				allowedAbilities.forEach(function (attr) {
					let newAbility = data.abilities[attr];
					let abilities = profile.abilities;
					if (newAbility !== undefined)
						abilities[attr] = newAbility;
				});
			}
			profile.save(function (error, profile) {
				if (error)
					return callback(error);
				self.profile = profile.toJson();
				return callback(error, profile);
			});
		});
	}
}


var allowedAttributes = ["enslo", "division", "skill", "gatherMusic"];
var allowedAbilities = ["skulk", "lerk", "fade", "gorge", "onos", "commander"];


export default User;
