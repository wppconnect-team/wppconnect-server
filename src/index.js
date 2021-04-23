import { } from "dotenv/config";
import cors from "cors";
import express from "express";
import { Server } from "http";
import { Server as Socket } from "socket.io";
import routes from "./routes";
import path from "path";
import swaggerUi from 'swagger-ui-express';

const app = express();
const PORT = process.env.PORT;

const options = {
    cors: true,
    origins: ["*"],
};
const server = Server(app);
const io = new Socket(server, options);

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb" }));
app.use("/files", express.static(path.resolve(__dirname, "..", "WhatsAppImages")));

app.use((req, res, next) => {
    req.io = io;
    next();
});

io.on("connection", sock => {
    console.log(`ID: ${sock.id} entrou`);

    sock.on("disconnect", () => {
        console.log(`ID: ${sock.id} saiu`);
    });
});

app.use(routes);

const swaggerDocument = require('./swagger.json');
routes.use('/api-docs', swaggerUi.serve);
routes.get('/api-docs', swaggerUi.setup(swaggerDocument));

server.listen(PORT);
console.log(`Server is running on port: ${PORT}`);