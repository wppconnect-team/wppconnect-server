// Device Functions
import {clientsArray, getSession} from "../util/SessionUtil";

export async function setProfileName(req, res) {
    const {session} = req.params
    const {name} = req.body

    if (!getSession(session))
        return res.status(401).send({message: 'Sessão não informada.'});

    if (!name)
        return res.status(401).send({message: 'Digite um novo nome de perfil.'});

    try {
        await clientsArray[session].setProfileName(name);
        return res.status(201).json({
            response: {
                status: true,
                name: name,
                session: getSession(session)
            },
        })
    } catch (error) {
        res.status(400).json({
            response: {
                message: 'O nome de usuário de perfil não foi alterado.',
                session: getSession(session),
                log: error
            },
        })
    }
}

export async function setProfileImage(req, res) {
    const {session} = req.params
    const {path} = req.body

    if (!getSession(session))
        return res.status(401).send({message: 'Sessão não informada.'});

    if (!path)
        return res.status(401).send({message: 'Informe o caminho da imagem.'});

    try {
        await clientsArray[getSession(session)].setProfilePic(pathimage);
        res.status(201).json({
            response: {
                message: msg,
                session: getSession(session),
                path: path
            },
        })
    } catch (error) {
        res.status(400).json({
            response: {
                message: 'A foto de perfil não foi alterada.',
                session: getSession(session),
                log: error
            },
        })
    }
}

export async function showAllContacts(req, res) {
    const {session} = req.params

    if (!getSession(session))
        return res.status(401).send({auth: false, message: 'Sessão não informada.'});

    try {
        const contacts = await clientsArray[getSession(session)].getAllContacts();
        res.status(200).json({
            response: contacts,
            session: getSession(session),
        })
    } catch (error) {
        res.status(401).json({
            response: 'O Whatsapp não está conectado',
            session: getSession(session),
        })
    }
}