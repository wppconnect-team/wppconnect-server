"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.checkSessionConnected = exports.showAllSessions = exports.closeSession = exports.startSession = exports.startAllSessions = undefined;

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var startAllSessions = exports.startAllSessions = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(req, res) {
        var _this = this;

        var allSessions;
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _context2.next = 2;
                        return (0, _GetAllTokens2.default)();

                    case 2:
                        allSessions = _context2.sent;


                        allSessions.map(function () {
                            var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(session) {
                                return _regenerator2.default.wrap(function _callee$(_context) {
                                    while (1) {
                                        switch (_context.prev = _context.next) {
                                            case 0:
                                                _context.next = 2;
                                                return (0, _CreateSessionUtil.opendata)(req, res, (0, _SessionUtil.getSession)(session));

                                            case 2:
                                            case "end":
                                                return _context.stop();
                                        }
                                    }
                                }, _callee, _this);
                            }));

                            return function (_x3) {
                                return _ref2.apply(this, arguments);
                            };
                        }());

                        _context2.next = 6;
                        return res.status(200).json({ status: "Success", message: "Iniciando todas as sessões" });

                    case 6:
                        return _context2.abrupt("return", _context2.sent);

                    case 7:
                    case "end":
                        return _context2.stop();
                }
            }
        }, _callee2, this);
    }));

    return function startAllSessions(_x, _x2) {
        return _ref.apply(this, arguments);
    };
}();

var startSession = exports.startSession = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(req, res) {
        var session;
        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        session = req.params.session;
                        _context3.next = 3;
                        return (0, _CreateSessionUtil.opendata)(req, res, (0, _SessionUtil.getSession)(session));

                    case 3:
                    case "end":
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function startSession(_x4, _x5) {
        return _ref3.apply(this, arguments);
    };
}();

var closeSession = exports.closeSession = function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(req, res) {
        var session;
        return _regenerator2.default.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        session = req.params.session;
                        _context4.next = 3;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].close();

                    case 3:
                        _SessionUtil.sessions.filter(function (item) {
                            return item !== session;
                        }); //remove a sessão especifica de todas as sessões

                        req.io.emit('whatsapp-status', false);

                    case 5:
                    case "end":
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    return function closeSession(_x6, _x7) {
        return _ref4.apply(this, arguments);
    };
}();

var showAllSessions = exports.showAllSessions = function () {
    var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(req, res) {
        return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        res.status(200).json(_SessionUtil.sessions); //mostra todas as sessões que estão ativas

                    case 1:
                    case "end":
                        return _context5.stop();
                }
            }
        }, _callee5, this);
    }));

    return function showAllSessions(_x8, _x9) {
        return _ref5.apply(this, arguments);
    };
}();

var checkSessionConnected = exports.checkSessionConnected = function () {
    var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(req, res) {
        var session, response;
        return _regenerator2.default.wrap(function _callee6$(_context6) {
            while (1) {
                switch (_context6.prev = _context6.next) {
                    case 0:
                        session = req.params.session;

                        if ((0, _SessionUtil.getSession)(session)) {
                            _context6.next = 3;
                            break;
                        }

                        return _context6.abrupt("return", res.status(401).send({ auth: false, message: 'Sessão não informada.' }));

                    case 3:
                        _context6.prev = 3;
                        _context6.next = 6;
                        return _SessionUtil.clientsArray[(0, _SessionUtil.getSession)(session)].isConnected();

                    case 6:
                        response = _context6.sent;
                        return _context6.abrupt("return", res.status(200).json({
                            response: response,
                            message: 'O Whatsapp está aberto.'
                        }));

                    case 10:
                        _context6.prev = 10;
                        _context6.t0 = _context6["catch"](3);
                        return _context6.abrupt("return", res.status(200).json({
                            response: false,
                            message: 'O Whatsapp não está aberto.'
                        }));

                    case 13:
                    case "end":
                        return _context6.stop();
                }
            }
        }, _callee6, this, [[3, 10]]);
    }));

    return function checkSessionConnected(_x10, _x11) {
        return _ref6.apply(this, arguments);
    };
}();

var _SessionUtil = require("../util/SessionUtil");

var _CreateSessionUtil = require("../util/CreateSessionUtil");

var _GetAllTokens = require("../util/GetAllTokens");

var _GetAllTokens2 = _interopRequireDefault(_GetAllTokens);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//# sourceMappingURL=SessionController.js.map