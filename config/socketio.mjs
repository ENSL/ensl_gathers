import winston from "winston";
import User from "../lib/user/user.mjs";
import config from "./config.mjs";
import EnslClient from "../lib/ensl/client.mjs";
import chatController from "../lib/chat/controller.mjs"
import gatherController from "../lib/gather/controller.mjs"
import userController from "../lib/user/controller.mjs";
import eventController from "../lib/event/controller.mjs";
import usersHelper from "../lib/user/helper.mjs";

const parseCookies = EnslClient.parseCookies;

const assignRandomUser = (socket, next) => {
	usersHelper.getRandomUser(function (error, user) {
		if (error) {
			winston.error(error);
			return next(new Error("Authentication Failed"))
		}
		socket._user = user;
		return next();
	});
};

const assignFixedUser = (socket, next, userId) => {
	usersHelper.getFixedUser(userId, function (error, user) {
		if (error) {
			winston.error(error);
			return next(new Error("Authentication Failed"))
		}
		socket._user = user;
		return next();
	});
};

const handleFailedAuth = (socket, next) => {
	if (process.env.RANDOM_USER) {
		return assignRandomUser(socket, next);
	} else if (process.env.FIXED_USER) {
		return assignFixedUser(socket, next, process.env.FIXED_USER);
	} else {
		return next(new Error("Authentication Failed"));
	}
};

export default function configureSockerIO(io) {
	var rootNamespace = io.of('/')

	// Authentication
	io.use((socket, next) => {
		let cookies = parseCookies(socket);

		if (!cookies) {
			return handleFailedAuth(socket, next);
		}

		let session = cookies[config.session_store_name];

		if (!session) {
			return handleFailedAuth(socket, next);
		}

		EnslClient.decodeSession(session, function (error, userId) {
			if (error) return handleFailedAuth(socket, next);
			User.find(userId, (error, user) => {
				if (error) {
					winston.error(error);
					return next(new Error("Authentication failed"));
				}
				socket._user = user;
				if (socket._user.bans.gather) return next(new Error("Gather Banned"));
				winston.info("Logged in:", user.username, user.id);
				return next();
			});
		});
	});

	userController(rootNamespace);
	chatController(rootNamespace);
	gatherController(rootNamespace);
	eventController(rootNamespace);
};
