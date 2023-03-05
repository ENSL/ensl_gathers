/*
 * User Controller
 *
 * Server API
 * users:update - Update list of users
 *
 * Client API
 * users:online - User is on the page
 * users:away - User is away from page
 * users:authorize - Sign on with arbitary user ID (to be enabled for admin only)
 * users:refresh - Request new user list
 *
 */

import winston from "winston";
import _ from "lodash";

import User from "./user.mjs";

var userCache = {};

export default namespace => {
	var refreshUsers = socket => {
		var receivers = (socket !== undefined) ? [socket] : namespace.sockets;

		var newCache = {};
		for (let socketid in namespace.sockets) {
			let socket = namespace.sockets[socketid];
			var user = socket._user;
			newCache[user.id] = user;
		}

		userCache = newCache;

		var users = [];

		for (var id in userCache) {
			if (userCache.hasOwnProperty(id)) {
				users.push(userCache[id]);
			}
		}


		for (let socketid in receivers) {
			let socket = receivers[socketid];
			socket.emit('users:update', {
				count: users.length,
				users: users,
				currentUser: socket._user
			});
		}
	};

	namespace.on('connection', socket => {
		refreshUsers();

		socket.on('users:refresh', refreshUsers.bind(null, socket));

		socket.on('users:update:profile', data => {
			if (socket._user.id !== data.id) return;
			socket._user.updateProfile(data.profile, function (error) {
				if (error) {
					winston.error(error);
					return;
				}
				refreshUsers();
			});
		});

		socket.on('users:disconnect', data => {
			const id = data.id;
			if (typeof id !== 'number' || !socket._user.admin) return;
			Object.values(namespace.sockets)
				.filter(socket => socket._user.id === id)
				.forEach(socket => socket.disconnect());
		});

		socket.on("users:authorize", data => {
			if (!socket._user.isUserAdmin()) return;
			var id = parseInt(data.id, 10);
			if (isNaN(id)) return;
			User.find(id, (error, user) => {
				if (error) {
					winston.error(error);
					return null;
				}
				socket._user = user;
				winston.info("Logged in:", user.username, user.id);
				refreshUsers();
			});
		});

		socket.on('disconnect', socket => { refreshUsers(); });
	});
};
