'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.sendFile = exports.sendImage = exports.sendMessage = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var sendMessage = exports.sendMessage = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res) {
        var session, _req$body, phone, message, _req$body$isGroup, isGroup;

        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        session = req.params.session;
                        _req$body = req.body, phone = _req$body.phone, message = _req$body.message, _req$body$isGroup = _req$body.isGroup, isGroup = _req$body$isGroup === undefined ? false : _req$body$isGroup;
                        _context.prev = 2;

                        if (!isGroup) {
                            _context.next = 8;
                            break;
                        }

                        _context.next = 6;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].sendText(phone + "@g.us", message);

                    case 6:
                        _context.next = 10;
                        break;

                    case 8:
                        _context.next = 10;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].sendText(phone + "@c.us", message);

                    case 10:

                        returnSucess(res, session, phone);
                        req.io.emit('mensagem-enviada', { message: message, to: phone });
                        _context.next = 17;
                        break;

                    case 14:
                        _context.prev = 14;
                        _context.t0 = _context['catch'](2);

                        returnError(res, session, _context.t0);

                    case 17:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[2, 14]]);
    }));

    return function sendMessage(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

var sendImage = exports.sendImage = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(req, res) {
        var session, _req$body2, phone, caption, path, _req$body2$isGroup, isGroup;

        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        session = req.params.session;
                        _req$body2 = req.body, phone = _req$body2.phone, caption = _req$body2.caption, path = _req$body2.path, _req$body2$isGroup = _req$body2.isGroup, isGroup = _req$body2$isGroup === undefined ? false : _req$body2$isGroup;

                        if (phone) {
                            _context2.next = 4;
                            break;
                        }

                        return _context2.abrupt('return', res.status(401).send({ message: 'Telefone não informado.' }));

                    case 4:
                        if ((0, _SessionUtil.getSession)(session)) {
                            _context2.next = 6;
                            break;
                        }

                        return _context2.abrupt('return', res.status(401).send({ message: 'Sessão não informada.' }));

                    case 6:
                        if (path) {
                            _context2.next = 8;
                            break;
                        }

                        return _context2.abrupt('return', res.status(401).send({
                            message: 'Informe o caminho da imagem. Exemplo: C:\\folder\\image.jpg.'
                        }));

                    case 8:
                        _context2.prev = 8;

                        if (!isGroup) {
                            _context2.next = 14;
                            break;
                        }

                        _context2.next = 12;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].sendImage(phone + "@g.us", //phone
                        path, //path
                        'image-api.jpg', //image name
                        caption //msg (caption)
                        );

                    case 12:
                        _context2.next = 16;
                        break;

                    case 14:
                        _context2.next = 16;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].sendImage(phone + "@c.us", //phone
                        path, //path
                        'image-api.jpg', //image name
                        caption //msg (caption)
                        );

                    case 16:

                        returnSucess(res, session, phone);
                        _context2.next = 22;
                        break;

                    case 19:
                        _context2.prev = 19;
                        _context2.t0 = _context2['catch'](8);

                        returnError(res, session, _context2.t0);

                    case 22:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this, [[8, 19]]);
    }));

    return function sendImage(_x3, _x4) {
        return _ref2.apply(this, arguments);
    };
}();

var sendFile = exports.sendFile = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(req, res) {
        var session, _req$body3, path, phone, _req$body3$isGroup, isGroup;

        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        session = req.params.session;
                        _req$body3 = req.body, path = _req$body3.path, phone = _req$body3.phone, _req$body3$isGroup = _req$body3.isGroup, isGroup = _req$body3$isGroup === undefined ? false : _req$body3$isGroup;

                        if ((0, _SessionUtil.getSession)(session)) {
                            _context3.next = 4;
                            break;
                        }

                        return _context3.abrupt('return', res.status(401).send({ message: 'Sessão não informada.' }));

                    case 4:
                        if (path) {
                            _context3.next = 6;
                            break;
                        }

                        return _context3.abrupt('return', res.status(401).send({ message: 'O caminho do arquivo não foi informado.' }));

                    case 6:
                        _context3.prev = 6;

                        if (!isGroup) {
                            _context3.next = 12;
                            break;
                        }

                        _context3.next = 10;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].sendFile(phone + "@c.us", //phone
                        path, //path file
                        'My File', //Title File
                        'Look this file' //Caption
                        );

                    case 10:
                        _context3.next = 14;
                        break;

                    case 12:
                        _context3.next = 14;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].sendFile(phone + "@g.us", //phone
                        path, //path file
                        'My File', //Title File
                        'Look this file' //Caption
                        );

                    case 14:

                        returnSucess(res, session, phone);
                        _context3.next = 20;
                        break;

                    case 17:
                        _context3.prev = 17;
                        _context3.t0 = _context3['catch'](6);

                        returnError(res, session, _context3.t0);

                    case 20:
                    case 'end':
                        return _context3.stop();
                }
            }
        }, _callee3, this, [[6, 17]]);
    }));

    return function sendFile(_x5, _x6) {
        return _ref3.apply(this, arguments);
    };
}();

var _SessionUtil = require('../util/SessionUtil');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function returnError(res, session, error) {
    res.status(400).json({
        response: {
            message: 'Sua mensagem não foi enviada.',
            session: (0, _SessionUtil.getSession)(session),
            log: error
        }
    });
}

function returnSucess(res, session, phone) {
    res.status(201).json({
        response: {
            message: "Mensagem enviada com sucesso.",
            contact: phone,
            session: (0, _SessionUtil.getSession)(session)
        }
    });
}
//# sourceMappingURL=MessageController.js.map