import bcrypt from 'bcrypt';
import {clientsArray} from "../util/sessionUtil";

function formatSession(session) {
    return session.split(":")[0];
}

const verifyToken = (req, res, next) => {
    const secureToken = req.serverOptions.secretKey;

    const {session} = req.params;
    const {authorization: token} = req.headers;
    if (!session)
        return res.status(401).send({message: 'Session not informed'});

    try {
        let tokenDecrypt = '';
        let sessionDecrypt = '';

        try {
            sessionDecrypt = session.split(":")[0]
            tokenDecrypt = session.split(":")[1].replace(/_/g, '/').replace(/-/g, '+')
        } catch (error) {
            try {
                if (token.split(" ").length > 0) tokenDecrypt = token.split(" ")[1].replace(/_/g, '/').replace(/-/g, '+')
            } catch (e) {
                req.logger.error(e);
                return res.status(401).json({error: "Check that the Session and Token are correct", message: error})
            }
        }

        bcrypt.compare(sessionDecrypt + secureToken, tokenDecrypt, function (err, result) {
            if (result) {
                req.session = formatSession(req.params.session);
                req.token = tokenDecrypt;
                req.client = clientsArray[req.session];
                next();
            } else {
                return res.status(401).json({error: "Check that the Session and Token are correct"})
            }
        });
    } catch (error) {
        req.logger.error(error);
        return res.status(401).json({error: "Check that the Session and Token are correct.", message: error})
    }
}

export default verifyToken