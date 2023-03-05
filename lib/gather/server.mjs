import fs from "fs";
import {resolve} from "path";
import winston from "winston";
import EnslClient from "../ensl/client.mjs";

const client = new EnslClient();
const serverFile = resolve("config/data/servers.json");

const REFRESH_INTERVAL = 1000 * 60 * 60; // Check every hour

class Server {
	static list = JSON.parse(fs.readFileSync(serverFile)).servers;
	static updateServerList = () => {
		client.getServers((error, result) => {
			if (error) {
				winston.error("Unable to download server list")
				winston.error(error);
				return;
			};
			Server.list = result.servers;
		});
	}
}


Server.updateServerList();
setInterval(Server.updateServerList, REFRESH_INTERVAL);

export default Server;

