const bcrypt = require('bcrypt');
const secureToken = process.env.SECURE_TOKEN;

module.exports.verifyToken = (req, res, next) => {
    const {session} = req.params

    try {
        const sessionDecrypt = session.split(":")[0]
        const tokenDecrypt = session.split(":")[1].replaceAll("slash", "/")

        bcrypt.compare(sessionDecrypt + secureToken, tokenDecrypt, function (err, result) {
            console.log(result)

            if (result) {
                next();
            } else {
                res.status(401).json({error: "Verifique se a Session e o Token estão corretos."})
            }
        });
    } catch (error) {
        res.status(401).json({error: "Verifique se a Session e o Token estão corretos."})
    }
}