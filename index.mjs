"use strict";

import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import config from "./config/config.mjs";
import "./db/index.mjs";
import configureExpress from "./config/express.mjs";
import addRoutes from "./config/routes.mjs"
import configureSocketIO from "./config/socketio.mjs";

const env = process.env.NODE_ENV || "development";

const app = express();
const server = createServer(app);
const io = new Server(server);

// Configure express
configureExpress(app);

// Add routes
addRoutes(app);

// Configure socket.io server
configureSocketIO(io);

server.listen(config.port);
console.log("Listening on port", config.port);

export default {
	app: app,
	server: server,
	io: io
};
