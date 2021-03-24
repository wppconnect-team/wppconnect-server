'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.showAllContacts = exports.setProfileImage = exports.setProfileName = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var setProfileName = exports.setProfileName = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res) {
        var session, name;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        session = req.params.session;
                        name = req.body.name;

                        if ((0, _SessionUtil.getSession)(session)) {
                            _context.next = 4;
                            break;
                        }

                        return _context.abrupt('return', res.status(401).send({ message: 'Sessão não informada.' }));

                    case 4:
                        if (name) {
                            _context.next = 6;
                            break;
                        }

                        return _context.abrupt('return', res.status(401).send({ message: 'Digite um novo nome de perfil.' }));

                    case 6:
                        _context.prev = 6;
                        _context.next = 9;
                        return _SessionUtil.clientsArray[session].setProfileName(name);

                    case 9:
                        return _context.abrupt('return', res.status(201).json({
                            response: {
                                status: true,
                                name: name,
                                session: (0, _SessionUtil.getSession)(session)
                            }
                        }));

                    case 12:
                        _context.prev = 12;
                        _context.t0 = _context['catch'](6);

                        res.status(400).json({
                            response: {
                                message: 'O nome de usuário de perfil não foi alterado.',
                                session: (0, _SessionUtil.getSession)(session),
                                log: _context.t0
                            }
                        });

                    case 15:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[6, 12]]);
    }));

    return function setProfileName(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}(); // Device Functions


var setProfileImage = exports.setProfileImage = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(req, res) {
        var session, path;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        session = req.params.session;
                        path = req.body.path;

                        if ((0, _SessionUtil.getSession)(session)) {
                            _context2.next = 4;
                            break;
                        }

                        return _context2.abrupt('return', res.status(401).send({ message: 'Sessão não informada.' }));

                    case 4:
                        if (path) {
                            _context2.next = 6;
                            break;
                        }

                        return _context2.abrupt('return', res.status(401).send({ message: 'Informe o caminho da imagem.' }));

                    case 6:
                        _context2.prev = 6;
                        _context2.next = 9;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].setProfilePic(pathimage);

                    case 9:
                        res.status(201).json({
                            response: {
                                message: msg,
                                session: (0, _SessionUtil.getSession)(session),
                                path: path
                            }
                        });
                        _context2.next = 15;
                        break;

                    case 12:
                        _context2.prev = 12;
                        _context2.t0 = _context2['catch'](6);

                        res.status(400).json({
                            response: {
                                message: 'A foto de perfil não foi alterada.',
                                session: (0, _SessionUtil.getSession)(session),
                                log: _context2.t0
                            }
                        });

                    case 15:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this, [[6, 12]]);
    }));

    return function setProfileImage(_x3, _x4) {
        return _ref2.apply(this, arguments);
    };
}();

var showAllContacts = exports.showAllContacts = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(req, res) {
        var session, contacts;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        session = req.params.session;

                        if ((0, _SessionUtil.getSession)(session)) {
                            _context3.next = 3;
                            break;
                        }

                        return _context3.abrupt('return', res.status(401).send({ auth: false, message: 'Sessão não informada.' }));

                    case 3:
                        _context3.prev = 3;
                        _context3.next = 6;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].getAllContacts();

                    case 6:
                        contacts = _context3.sent;

                        res.status(200).json({
                            response: contacts,
                            session: (0, _SessionUtil.getSession)(session)
                        });
                        _context3.next = 13;
                        break;

                    case 10:
                        _context3.prev = 10;
                        _context3.t0 = _context3['catch'](3);

                        res.status(401).json({
                            response: 'O Whatsapp não está conectado',
                            session: (0, _SessionUtil.getSession)(session)
                        });

                    case 13:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this, [[3, 10]]);
    }));

    return function showAllContacts(_x5, _x6) {
        return _ref3.apply(this, arguments);
    };
}();

var _SessionUtil = require('../util/SessionUtil');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=DeviceController.js.map