const bcrypt = require('bcrypt');
const secureToken = process.env.SECURE_TOKEN;

module.export = {
    async decryptSession(session, token) {
        bcrypt.compare(session + secureToken, token, function (err, result) {
            if (!result) {
                return false
            } else {
                return true
            }
        });
    }
}