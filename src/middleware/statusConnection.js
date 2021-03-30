import {clientsArray} from "../util/SessionUtil";

export default async function statusConnection(req, res, next) {
    const session = req.session;

    try {
        const teste = await clientsArray[session].isConnected();
        console.log(teste)
        next();
    } catch (error) {
        return res.status(400).json({
            response: false,
            status: "Disconnected",
            message: 'A sessão do WhatsApp não está ativa.'
        })
    }
}