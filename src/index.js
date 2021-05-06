import {config} from "dotenv";
import Logger from "./util/logger";
import {startAllSessions} from "./util/functions";
import cors from "cors";
import express from "express";
import {createServer} from "http";
import {Server as Socket} from "socket.io";
import routes from "./routes";
import path from "path";
import fs from 'fs'
import swaggerUi from 'swagger-ui-express';

config();
const __dirname = path.resolve(path.dirname(''));
const app = express();
const PORT = process.env.PORT;

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

let dirFiles = path.resolve(__dirname, '..', 'WhatsAppImages');
if (!fs.existsSync(dirFiles)) {
    fs.mkdirSync(dirFiles);
}

import swaggerDocument from './swagger.json';
routes.use('/api-docs', swaggerUi.serve);
routes.get('/api-docs', swaggerUi.setup(swaggerDocument));

http.listen(PORT, () => {
    Logger.info(`Server is running on port: ${PORT}`);
    if (process.env.START_ALL_SESSION)
        startAllSessions(process.env.PORT, process.env.SECRET_KEY);
});



