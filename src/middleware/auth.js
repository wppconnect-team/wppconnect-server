import bcrypt from 'bcrypt';

const secureToken = process.env.SECURE_TOKEN;

const verifyToken = (req, res, next) => {
    const {session} = req.params

    try {
        const sessionDecrypt = session.split(":")[0]
        const tokenDecrypt = session.split(":")[1].replace("slash", "/")

        bcrypt.compare(sessionDecrypt + secureToken, tokenDecrypt, function (err, result) {
            if (result) {
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