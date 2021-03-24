"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _bcrypt = require("bcrypt");

var _bcrypt2 = _interopRequireDefault(_bcrypt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var secureToken = process.env.SECURE_TOKEN;

var verifyToken = function verifyToken(req, res, next) {
    var session = req.params.session;


    try {
        var sessionDecrypt = session.split(":")[0];
        var tokenDecrypt = session.split(":")[1].replace("slash", "/");

        _bcrypt2.default.compare(sessionDecrypt + secureToken, tokenDecrypt, function (err, result) {
            if (result) {
                next();
            } else {
                return res.status(401).json({ error: "Verifique se a Session e o Token estão corretos." });
            }
        });
    } catch (error) {
        return res.status(401).json({ error: "Verifique se a Session e o Token estão corretos.", message: error });
    }
};

exports.default = verifyToken;
//# sourceMappingURL=auth.js.map