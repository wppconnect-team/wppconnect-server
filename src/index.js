import {config} from "dotenv";
import swaggerUi from 'swagger-ui-express';
import cors from "cors";
import express from "express";
import {createServer} from "http";
import {Server as Socket} from "socket.io";
import path from "path";
import fs from 'fs'
import routes from "./routes";

config();

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
    console.log(`ID: ${sock.id} is logged`);

    sock.on("disconnect", () => {
        console.log(`ID: ${sock.id} logout`);
    });
});

app.use(routes);

let dirFiles = path.resolve(__dirname, '..', 'WhatsAppImages');
if (!fs.existsSync(dirFiles)) {
    fs.mkdirSync(dirFiles);
}

const swaggerDocument = require('./swagger.json');
routes.use('/api-docs', swaggerUi.serve);
routes.get('/api-docs', swaggerUi.setup(swaggerDocument));

http.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
