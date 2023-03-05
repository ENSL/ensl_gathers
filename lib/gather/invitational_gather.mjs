import winston from "winston";
import EnslClient from "../ensl/client.mjs";

const env = process.env.NODE_ENV || "development";
const client = new EnslClient();
const REFRESH_INTERVAL = 1000 * 60; // Check every minute
const invitationalTeamId = 949;

class InvitationalGather {
	static list = [];
	static updateList = function () {
		client.getTeamById({
			id: invitationalTeamId
		}, (error, result) => {
			if (error) {
				winston.error("Unable to download team list")
				winston.error(error);
				return;
			};
			InvitationalGather.list = result.body.members;
		});
	};
}

InvitationalGather.updateList();

setInterval(InvitationalGather.updateList, REFRESH_INTERVAL);

export default InvitationalGather;
