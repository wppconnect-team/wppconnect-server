import bcrypt from 'bcrypt';
import {getSession} from "../util/SessionUtil";

const secureToken = process.env.SECURE_TOKEN;

const verifyToken = (req, res, next) => {
    const {session} = req.params

    if (!getSession(session))
        return res.status(401).send({message: 'Sessão não informada.'});

    try {
        const sessionDecrypt = session.split(":")[0]
        const tokenDecrypt = session.split(":")[1].replace(/\//g, '_').replace(/\+/g, '-')

        bcrypt.compare(sessionDecrypt + secureToken, tokenDecrypt, function (err, result) {
            if (result) {
                req.session = req.params.session.split(":")[0];
                next();
            } else {
                return res.status(401).json({error: "Verifique se a Session e o Token estão corretos."})
            }
        });
    } catch (error) {
        return res.status(401).json({error: "Verifique se a Session e o Token estão corretos.", message: error})
    }
}

export default verifyToken