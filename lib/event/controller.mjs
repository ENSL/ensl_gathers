/*
 * Events Controller
 *
 * Server API
 * event:append - New event to be added to history
 *
 */

import pubsub from "./pubsub.mjs";

export default namespace => {
	pubsub.on("newEvent", event => {
		if (!event.public) return;
		namespace.emit("event:append", {
			type: event.type,
			description: event.description,
			createdAt: event.createdAt
		})
	});
};
