import bcrypt from 'bcrypt';

const saltRounds = 10;
const secureToken = process.env.SECURE_TOKEN;

export async function encryptSession(req, res) {
    const {session} = req.params

    bcrypt.hash(session + secureToken, saltRounds, function (err, hash) {
        if (err) {
            return res.status(400).json(err)
        }

        return res.status(201).json({
            status: "Success",
            session: session,
            token: hash.replace('/', 'slash'),
            full: `${session}:${hash.replace('/', 'slash')}`
        })
    });
}