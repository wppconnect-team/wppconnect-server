import {clientsArray, getSession, sessions} from "../util/SessionUtil";
import {opendata} from "../util/CreateSessionUtil";
import getAllTokens from "../util/GetAllTokens";

export async function startAllSessions(req, res) {
    const allSessions = await getAllTokens();

    allSessions.map(async (session) => {
        await opendata(req, res, getSession(session))
    })

    return await res.status(200).json({status: "Success", message: "Iniciando todas as sessões"})
}

export async function startSession(req, res) {
    const {session} = req.params;

    await opendata(req, res, getSession(session))
}

export async function closeSession(req, res) {
    const {session} = req.params;

    await clientsArray[getSession(session)].close();
    sessions.filter(item => item !== session) //remove a sessão especifica de todas as sessões

    req.io.emit('whatsapp-status', false);
}

export async function showAllSessions(req, res) {
    res.status(200).json(sessions); //mostra todas as sessões que estão ativas
}

export async function checkSessionConnected(req, res) {
    const {session} = req.params;

    if (!getSession(session))
        return res.status(401).send({auth: false, message: 'Sessão não informada.'});

    try {
        const response = await clientsArray[getSession(session)].isConnected();
        return res.status(200).json({
            response: response,
            message: 'O Whatsapp está aberto.'
        })

    } catch (error) {
        return res.status(200).json({
            response: false,
            message: 'O Whatsapp não está aberto.'
        })
    }
}