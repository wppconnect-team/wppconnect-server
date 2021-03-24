import bcrypt from 'bcrypt';

const saltRounds = 10;
const secureTokenEnv = process.env.SECRET_KEY;

export async function encryptSession(req, res) {
    const {session, secretkey} = req.params

    if (secretkey !== secureTokenEnv) {
        return res.status(400).json({
            response: false,
            message: 'O token informado está incorreto.'
        })
    }

    bcrypt.hash(session + secureTokenEnv, saltRounds, function (err, hash) {
        if (err)
            return res.status(400).json(err)

        const hashFormat = hash.replace('/', '_').replace('+', '-')
        return res.status(201).json({
            status: "Success",
            session: session,
            token: hashFormat,
            full: `${session}:${hashFormat}`
        })
    });
}