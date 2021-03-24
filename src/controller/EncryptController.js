import bcrypt from 'bcrypt';

const saltRounds = 10;
const secureToken = process.env.SECURE_TOKEN;

export async function encryptSession(req, res) {
    const {session} = req.params

    bcrypt.hash(session + secureToken, saltRounds, function (err, hash) {
        if (err) {
            return res.status(400).json(err)
        }

        const hashFormat = hash.replace('/', '_').replace('+', '-')

        return res.status(201).json({
            status: "Success",
            session: session,
            token: hashFormat,
            full: `${session}:${hashFormat}`
        })
    });
}