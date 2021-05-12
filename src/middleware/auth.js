import bcrypt from 'bcrypt';
import {clientsArray, config} from "../util/sessionUtil";
import Logger from "../util/logger";

function formatSession(session) {
    return session.split(":")[0];
}

const verifyToken = (req, res, next) => {
    const secureToken = config.secretKey;

    const {session} = req.params;
    const {authorization: token} = req.headers;
    if (!session)
        return res.status(401).send({message: 'Sessão não informada.'});

    try {
        let tokenDecrypt = '';
        let sessionDecrypt = '';

        try {
            sessionDecrypt = session.split(":")[0]
            tokenDecrypt = session.split(":")[1].replace(/_/g, '/').replace(/-/g, '+')
        } catch (error) {
            try {
                tokenDecrypt = token.split(" ")[1].replace(/_/g, '/').replace(/-/g, '+')
            } catch (e) {
                Logger.error(e);
                return res.status(401).json({error: "Verifique se a Session e o Token estão corretos.", message: error})
            }
        }

        bcrypt.compare(sessionDecrypt + secureToken, tokenDecrypt, function (err, result) {
            if (result) {
                req.session = formatSession(req.params.session);
                req.token = tokenDecrypt;
                req.client = clientsArray[req.session];
                next();
            } else {
                return res.status(401).json({error: "Verifique se a Session e o Token estão corretos."})
            }
        });
    } catch (error) {
        Logger.error(e);
        return res.status(401).json({error: "Verifique se a Session e o Token estão corretos.", message: error})
    }
}

export default verifyToken