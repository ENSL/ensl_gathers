import winston from "winston";
import config from "./config.mjs";
import GatherPool from "../lib/gather/gather_pool.mjs";
import mongoose from "mongoose";
import cors from "cors"

const Message = mongoose.model("Message");

export default function configureRoutes(app) {
	app.use(cors());

	app.get("/", (request, response, next) => {
		response.render("gather.hbs", {
			redirect: config.ensl_url,
			bot_url: config.steam_bot_link,
			rules_url: config.ensl_rules_url
		});
	});

	app.get("/redirect", (request, response, next) => {
		response.render("redirect.hbs", {
			redirect: config.ensl_url
		});
	});

	app.get("/gathers/current", (request, response) => {
		response.status(200).json(GatherPool.get("classic").current.toJson());
	});

	app.get("/api/messages", (request, response) => {
		const page = parseInt(request.query.page, 10) || 0;

		let limit = parseInt(request.query.limit, 10) || 250;
		if (limit > 250 || limit < 1) limit = 250;

		let query = {};
		let searchTerm = request.query.query;
		if (searchTerm) {
			query = {
				$text: {
					$search: searchTerm
				}
			};
		}
		Message
			.find(query)
			.limit(limit)
			.skip(page * limit)
			.sort({createdAt: -1})
			.exec((error, messages) => {
				if (error) {
					winston.error(error);
					return response.status(500).json({
						message: "An error occurred",
						error: JSON.stringify(error)
					});
				}
				response.status(200).json({
					messages: messages,
					page: page,
					limit: limit
				});
			});
		});

	app.get("/messages", (request, response) => {
		response.render("messages.hbs");
	});

	app.get("*", (request, response) => {
		response.status(404).render("404.hbs");
	});

	app.use(function (error, request, response, next) {
		winston.error(error);
		return response.status(500).render("500.hbs");
	});
};