import express from 'express';
import cors from 'cors'
import routes from "./routes";
import path from "path";

const app = express();

app.use(cors());
app.use(express.json({limit: "50mb"}));
app.use(express.urlencoded({limit: "50mb", extended: true}));

app.use("/files", express.static(path.resolve(__dirname, "..", "WhatsAppImages")));

app.use(routes);

export default app;