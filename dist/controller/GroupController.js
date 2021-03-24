'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.joinGroupByCode = exports.createGroup = undefined;

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var createGroup = exports.createGroup = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res) {
        var session, _req$body, groupname, phone;

        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        session = req.params.session;
                        _req$body = req.body, groupname = _req$body.groupname, phone = _req$body.phone;

                        if (session) {
                            _context.next = 4;
                            break;
                        }

                        return _context.abrupt('return', res.status(401).send({ message: 'Sessão não informada.' }));

                    case 4:
                        if (groupname) {
                            _context.next = 6;
                            break;
                        }

                        return _context.abrupt('return', res.status(401).send({ message: 'O nome do grupo não foi informado.' }));

                    case 6:
                        if (phone) {
                            _context.next = 8;
                            break;
                        }

                        return _context.abrupt('return', res.status(401).send({ message: 'O Telefone não foi informado.' }));

                    case 8:
                        _context.prev = 8;
                        _context.next = 11;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].createGroup(groupname, phone);

                    case 11:

                        returnSucess(res, session, phone, 'O grupo ' + groupname + ' foi criado com sucesso');
                        _context.next = 17;
                        break;

                    case 14:
                        _context.prev = 14;
                        _context.t0 = _context['catch'](8);

                        returnError(res, session, _context.t0, "O grupo não foi criado");

                    case 17:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[8, 14]]);
    }));

    return function createGroup(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

var joinGroupByCode = exports.joinGroupByCode = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(req, res) {
        var session, inviteCode;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        session = req.params.session;
                        inviteCode = req.body.inviteCode;

                        if ((0, _SessionUtil.getSession)(session)) {
                            _context2.next = 4;
                            break;
                        }

                        return _context2.abrupt('return', res.status(401).send({ message: 'A Sessão não foi informada.' }));

                    case 4:
                        if (inviteCode) {
                            _context2.next = 6;
                            break;
                        }

                        return _context2.abrupt('return', res.status(401).send({ message: 'Informe o Codigo de Convite' }));

                    case 6:
                        _context2.prev = 6;
                        _context2.next = 9;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].joinGroup(inviteCode);

                    case 9:

                        returnSucess(res, session, inviteCode, "Você entrou no grupo com sucesso");
                        _context2.next = 15;
                        break;

                    case 12:
                        _context2.prev = 12;
                        _context2.t0 = _context2['catch'](6);

                        returnError(res, session, _context2.t0, "Você não entrou no grupo.");

                    case 15:
                    case 'end':
                        return _context2.stop();
                }
            }
        }, _callee2, this, [[6, 12]]);
    }));

    return function joinGroupByCode(_x3, _x4) {
        return _ref2.apply(this, arguments);
    };
}();

var _SessionUtil = require('../util/SessionUtil');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function returnError(res, session, error, message) {
    res.status(400).json({
        response: {
            message: message,
            session: (0, _SessionUtil.getSession)(session),
            log: error
        }
    });
} // Group Functions


function returnSucess(res, session, phone, message) {
    res.status(201).json({
        response: {
            message: message,
            contact: phone,
            session: (0, _SessionUtil.getSession)(session)
        }
    });
}
//# sourceMappingURL=GroupController.js.map