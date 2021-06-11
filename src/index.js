import { createLogger } from "./util/logger";
import { createFolders, startAllSessions } from "./util/functions";
import cors from "cors";
import express from "express";
import { createServer } from "http";
import { Server as Socket } from "socket.io";
import routes from "./routes";
import path from "path";
import config from "./config.json";
import boolParser from "express-query-boolean";
import mergeDeep from "merge-deep";

export function initServer(serverOptions) {
    if (typeof serverOptions !== "object") {
        serverOptions = {};
    }

    serverOptions = mergeDeep({}, config, serverOptions);

    const logger = createLogger(serverOptions.log);

    const app = express();
    const PORT = process.env.PORT || serverOptions.port;

    const http = new createServer(app);
    const io = new Socket(http, {
        cors: true,
        origins: ["*"],
    });

    app.use(cors());
    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));
    app.use(
        "/files",
        express.static(path.resolve(__dirname, "..", "WhatsAppImages"))
    );
    app.use(boolParser());

    // Add request options
    app.use((req, res, next) => {
        req.serverOptions = serverOptions;
        req.logger = logger;
        req.io = io;
        next();
    });

    io.on("connection", (sock) => {
        logger.info(`ID: ${sock.id} entrou`);

        sock.on("disconnect", () => {
            logger.info(`ID: ${sock.id} saiu`);
        });
    });

    app.use(routes);

    createFolders();

    http.listen(PORT, () => {
        logger.info(`Server is running on port: ${PORT}`);
        logger.info(
            `\x1b[31m Visit ${serverOptions.host}:${PORT}/api-docs for Swagger docs`
        );

        if (serverOptions.startAllSession) startAllSessions(serverOptions, logger);
    });

    return {
        app,
        routes,
        logger
    };
}
