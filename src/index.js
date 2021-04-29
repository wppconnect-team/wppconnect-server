import {config} from "dotenv";
import {createServer} from "http";
import {Server as Socket} from "socket.io";
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from "path";
import app from "./server";
import routes from "./routes";

config();

const PORT = process.env.PORT;

let dirFiles = path.resolve(__dirname, '..', 'WhatsAppImages');
if (!fs.existsSync(dirFiles)) {
    fs.mkdirSync(dirFiles);
}

const options = {
    cors: true,
    origins: ["*"],
};
const http = new createServer(app);
const io = new Socket(http, options);

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

const swaggerDocument = require('./swagger.json');
routes.use('/api-docs', swaggerUi.serve);
routes.get('/api-docs', swaggerUi.setup(swaggerDocument));

http.listen(PORT, () => console.log(`Server is running on port: ${PORT}`));
