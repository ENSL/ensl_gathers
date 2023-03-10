import fs from "fs";
import {resolve} from "path";
import winston from "winston";
import EnslClient from "../ensl/client.mjs";

const client = new EnslClient();
const mapsPath = resolve("config/data/maps.json");
const REFRESH_INTERVAL = 1000 * 60 * 60; // Check every hour



class Map {
	static list = JSON.parse(fs.readFileSync(mapsPath)).maps;
	static updateMapList = () => {
		client.getMaps((error, result) => {
			if (error) {
				winston.error("Unable to download server list")
				winston.error(error);
				return;
			};
			Map.list = result.maps;
		});
	};
}
Map.updateMapList();

setInterval(Map.updateMapList, REFRESH_INTERVAL);

export default Map;
