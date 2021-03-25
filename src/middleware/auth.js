import bcrypt from 'bcrypt';

const secureToken = process.env.SECRET_KEY;

function formatSession(session) {
    return session.split(":")[0];
}

const verifyToken = (req, res, next) => {
    const {session} = req.params

    if (!session)
        return res.status(401).send({message: 'Sessão não informada.'});

    try {
        const sessionDecrypt = session.split(":")[0]
        const tokenDecrypt = session.split(":")[1].replace(/_/g, '/').replace(/-/g, '+')

        bcrypt.compare(sessionDecrypt + secureToken, tokenDecrypt, function (err, result) {
            if (result) {
                req.session = formatSession(req.params.session)
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