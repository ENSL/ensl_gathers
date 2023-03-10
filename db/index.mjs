import winston from "winston"
import mongoose from "mongoose";
import config from "../config/config.mjs";

mongoose.set('strictQuery', true);

var connect = function () {
  mongoose.connect(config.mongo.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(
    () => winston.info("MongoDB: Connection established"),
    error => winston.error(error)
  );
};

connect();

mongoose.connection.on("error", (error) => winston.error(error));
mongoose.connection.on("disconnected", () => winston.error("MongoDB: Was disconnected."));
mongoose.connection.on("reconnectFailed", () => winston.error("MongoDB: Reconnect Failed!"));

mongoose.connection.on("reconnected", () => winston.info("MongoDB: Connection established"));

// Load Models
import "./models/event.mjs";
import "./models/message.mjs";
import "./models/session.mjs";
import "./models/profile.mjs";
import "./models/archivedGather.mjs";
