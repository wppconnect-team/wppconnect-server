import {clientsArray} from "../util/SessionUtil";
import Logger from "../util/logger";

export default async function statusConnection(req, res, next) {
    try {
        await req.client.isConnected();
        next();
    } catch (error) {
        Logger.error(error);
        return res.status(400).json({
            response: false,
            status: "Disconnected",
            message: 'A sessão do WhatsApp não está ativa.'
        })
    }
}