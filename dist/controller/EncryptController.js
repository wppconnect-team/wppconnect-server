'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.encryptSession = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var encryptSession = exports.encryptSession = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res) {
        var session;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        session = req.params.session;


                        _bcrypt2.default.hash(session + secureToken, saltRounds, function (err, hash) {
                            if (err) {
                                return res.status(400).json(err);
                            }

                            return res.status(201).json({
                                status: "Success",
                                session: session,
                                token: hash.replace('/', 'slash'),
                                full: session + ':' + hash.replace('/', 'slash')
                            });
                        });

                    case 2:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function encryptSession(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

var _bcrypt = require('bcrypt');

var _bcrypt2 = _interopRequireDefault(_bcrypt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var saltRounds = 10;
var secureToken = process.env.SECURE_TOKEN;
//# sourceMappingURL=EncryptController.js.map