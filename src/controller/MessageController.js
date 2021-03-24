import {clientsArray} from '../util/SessionUtil'

function returnError(res, session, error) {
    res.status(400).json({
        response: {
            message: 'Sua mensagem não foi enviada.',
            session: session,
            log: error
        },
    })
}

function returnSucess(res, session, phone) {
    res.status(201).json({
        response: {
            message: "Mensagem enviada com sucesso.",
            contact: phone,
            session: session
        },
    })
}

export async function sendMessage(req, res) {
    const session = req.session
    const {phone, message, isGroup = false} = req.body

    try {
        if (isGroup) {
            await clientsArray[session].sendText(phone + "@g.us", message);
        } else {
            await clientsArray[session].sendText(phone + "@c.us", message);
        }

        returnSucess(res, session, phone)
        req.io.emit('mensagem-enviada', {message: message, to: phone});
    } catch (error) {
        console.log(error)

        returnError(res, session, error)
    }
}

export async function sendImage(req, res) {
    const session = req.session
    const {phone, caption, path, isGroup = false} = req.body

    if (!phone)
        return res.status(401).send({message: 'Telefone não informado.'});

    if (!path)
        return res.status(401).send({
            message: 'Informe o caminho da imagem. Exemplo: C:\\folder\\image.jpg.'
        });

    try {
        if (isGroup) {
            await clientsArray[session].sendImage(
                phone + "@g.us", //phone
                path, //path
                'image-api.jpg', //image name
                caption //msg (caption)
            );
        } else {
            await clientsArray[session].sendImage(
                phone + "@c.us", //phone
                path, //path
                'image-api.jpg', //image name
                caption //msg (caption)
            );
        }

        returnSucess(res, session, phone)
    } catch (error) {
        returnError(res, session, error)
    }
}

export async function sendFile(req, res) {
    const session = req.session
    const {path, phone, isGroup = false} = req.body

    if (!path)
        return res.status(401).send({message: 'O caminho do arquivo não foi informado.'});

    try {
        if (isGroup) {
            await clientsArray[session].sendFile(
                phone + "@c.us", //phone
                path, //path file
                'My File', //Title File
                'Look this file' //Caption
            );
        } else {
            await clientsArray[session].sendFile(
                phone + "@g.us", //phone
                path, //path file
                'My File', //Title File
                'Look this file' //Caption
            );
        }

        returnSucess(res, session, phone)
    } catch (error) {
        returnError(res, session, error)
    }
}