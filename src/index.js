import Logger from "./util/logger";
import {createFolders, startAllSessions} from "./util/functions";
import cors from "cors";
import express from "express";
import {createServer} from "http";
import {Server as Socket} from "socket.io";
import routes from "./routes";
import path from "path";
import {config} from './util/sessionUtil';
import boolParser from 'express-query-boolean';

const __dirname = path.resolve(path.dirname(''));
const app = express();

const PORT = config.port;

const options = {
    cors: true,
    origins: ["*"],
};
const http = new createServer(app);
const io = new Socket(http, options);

app.use(cors());
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({limit: "50mb", extended: true}));
app.use("/files", express.static(path.resolve(__dirname, "..", "WhatsAppImages")));
app.use(boolParser());

app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on("connection", sock => {
    Logger.info(`ID: ${sock.id} entrou`);

    sock.on("disconnect", () => {
        Logger.info(`ID: ${sock.id} saiu`);
    });
});

app.use(routes);

createFolders();

http.listen(PORT, () => {
    Logger.info(`Server is running on port: ${PORT}`);
    Logger.info(`\x1b[31m Visit ${config.host}:${PORT}/api-docs for Swagger docs`);

    if (config.startAllSession)
        startAllSessions();
});