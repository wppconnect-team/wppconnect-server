import {config} from '../util/sessionUtil';
import bcrypt from 'bcrypt';

const saltRounds = 10;

export async function encryptSession(req, res) {
    const {session, secretkey} = req.params;
    const {authorization: token} = req.headers;
    const secureTokenEnv = config.secretKey;

    let tokenDecrypt = '';

    if (secretkey === undefined) {
        tokenDecrypt = token.split(' ')[0];
    } else {
        tokenDecrypt = secretkey;
    }

    console.log(secureTokenEnv)

    if (tokenDecrypt !== secureTokenEnv) {
        return res.status(400).json({
            response: false,
            message: 'A SECRET_KEY informada está incorreta.'
        })
    }

    bcrypt.hash(session + secureTokenEnv, saltRounds, function (err, hash) {
        if (err)
            return res.status(400).json(err)

        const hashFormat = hash.replace(/\//g, '_').replace(/\+/g, '-')
        return res.status(201).json({
            status: "Success",
            session: session,
            token: hashFormat,
            full: `${session}:${hashFormat}`
        })
    });
}