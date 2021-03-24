import {clientsArray} from "../util/SessionUtil";

function returnError(res, session, error, message) {
    res.status(400).json({
        response: {
            message: message,
            session: session,
            log: error
        },
    })
}

function returnSucess(res, session, phone, message) {
    res.status(201).json({
        response: {
            message: message,
            contact: phone,
            session: session
        },
    })
}

export async function createGroup(req, res) {
    const session = req.session
    const {groupname, phone} = req.body

    if (!groupname)
        return res.status(401).send({message: 'O nome do grupo não foi informado.'});

    if (!phone)
        return res.status(401).send({message: 'O Telefone não foi informado.'});

    try {
        await clientsArray[session].createGroup(groupname, phone);

        returnSucess(res, session, phone, `O grupo ${groupname} foi criado com sucesso`)
    } catch (error) {
        returnError(res, session, error, "O grupo não foi criado")
    }
}

export async function joinGroupByCode(req, res) {
    const session = req.session
    const {inviteCode} = req.body

    if (!inviteCode)
        return res.status(401).send({message: 'Informe o Codigo de Convite'});

    try {
        await clientsArray[session].joinGroup(inviteCode);

        returnSucess(res, session, inviteCode, "Você entrou no grupo com sucesso")
    } catch (error) {
        returnError(res, session, error, "Você não entrou no grupo.")
    }
}