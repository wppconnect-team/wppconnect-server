"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.opendata = undefined;

var _regenerator = require("babel-runtime/regenerator");

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require("babel-runtime/helpers/asyncToGenerator");

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var opendata = exports.opendata = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee(req, res, session) {
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return createSessionUtil(req, res, _SessionUtil.clientsArray, session);

                    case 2:
                        _context.next = 4;
                        return res.status(201).json({
                            message: 'Inicializando Sessão',
                            session: session
                        });

                    case 4:
                    case "end":
                        return _context.stop();
                }
            }
        }, _callee, this);
    }));

    return function opendata(_x, _x2, _x3) {
        return _ref.apply(this, arguments);
    };
}();

var createSessionUtil = function () {
    var _ref2 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee2(req, res, clientsArray, session) {
        return _regenerator2.default.wrap(function _callee2$(_context2) {
            while (1) {
                switch (_context2.prev = _context2.next) {
                    case 0:
                        _context2.prev = 0;
                        _context2.next = 3;
                        return (0, _wppconnect.create)(session, function (base64Qr, asciiQR) {
                            exportQR(req, res, base64Qr, session);
                        }, function (statusFind) {
                            console.log(statusFind + '\n\n');
                        }, {
                            headless: true,
                            devtools: false,
                            useChrome: true,
                            debug: false,
                            logQR: true,
                            browserArgs: chromiumArgs,
                            refreshQR: 15000,
                            disableSpins: true
                        });

                    case 3:
                        clientsArray[session] = _context2.sent;
                        _context2.next = 6;
                        return start(req, res, clientsArray, session);

                    case 6:
                        _context2.next = 11;
                        break;

                    case 8:
                        _context2.prev = 8;
                        _context2.t0 = _context2["catch"](0);

                        console.log('error create -> ', _context2.t0);

                    case 11:
                    case "end":
                        return _context2.stop();
                }
            }
        }, _callee2, this, [[0, 8]]);
    }));

    return function createSessionUtil(_x4, _x5, _x6, _x7) {
        return _ref2.apply(this, arguments);
    };
}();

var start = function () {
    var _ref3 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee3(req, res, client, session) {
        return _regenerator2.default.wrap(function _callee3$(_context3) {
            while (1) {
                switch (_context3.prev = _context3.next) {
                    case 0:
                        _context3.next = 2;
                        return checkStateSession(req, res, client, session);

                    case 2:
                        _context3.next = 4;
                        return listenMessages(req, client, session);

                    case 4:
                    case "end":
                        return _context3.stop();
                }
            }
        }, _callee3, this);
    }));

    return function start(_x8, _x9, _x10, _x11) {
        return _ref3.apply(this, arguments);
    };
}();

var checkStateSession = function () {
    var _ref4 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee5(req, res, client, session) {
        var _this = this;

        return _regenerator2.default.wrap(function _callee5$(_context5) {
            while (1) {
                switch (_context5.prev = _context5.next) {
                    case 0:
                        _context5.next = 2;
                        return client[session].onStateChange(function () {
                            var _ref5 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee4(state) {
                                var conflits, tokenFile;
                                return _regenerator2.default.wrap(function _callee4$(_context4) {
                                    while (1) {
                                        switch (_context4.prev = _context4.next) {
                                            case 0:
                                                if (state === 'CONNECTED') {
                                                    req.io.emit('whatsapp-status', true);

                                                    _SessionUtil.sessions.push(session); //insere a nova sessão no session
                                                    console.log('Status Session -> ', session, ' connected');
                                                }

                                                conflits = [_wppconnect.SocketState.CONFLICT, _wppconnect.SocketState.UNPAIRED, _wppconnect.SocketState.UNLAUNCHED];

                                                if (!conflits.includes(state)) {
                                                    _context4.next = 16;
                                                    break;
                                                }

                                                _context4.prev = 3;
                                                _context4.next = 6;
                                                return client[session].useHere();

                                            case 6:
                                                _context4.next = 16;
                                                break;

                                            case 8:
                                                _context4.prev = 8;
                                                _context4.t0 = _context4["catch"](3);
                                                tokenFile = _path2.default.resolve(__dirname, '..', '..', 'tokens', session + ".data.json");
                                                _context4.next = 13;
                                                return client[session].close();

                                            case 13:
                                                _fs2.default.unlinkSync(tokenFile);

                                                _context4.next = 16;
                                                return createSessionUtil(req, res, client, session);

                                            case 16:
                                            case "end":
                                                return _context4.stop();
                                        }
                                    }
                                }, _callee4, _this, [[3, 8]]);
                            }));

                            return function (_x16) {
                                return _ref5.apply(this, arguments);
                            };
                        }());

                    case 2:
                    case "end":
                        return _context5.stop();
                }
            }
        }, _callee5, this);
    }));

    return function checkStateSession(_x12, _x13, _x14, _x15) {
        return _ref4.apply(this, arguments);
    };
}();

var listenMessages = function () {
    var _ref6 = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee6(req, client, session) {
        return _regenerator2.default.wrap(function _callee6$(_context6) {
            while (1) {
                switch (_context6.prev = _context6.next) {
                    case 0:
                        _context6.next = 2;
                        return client[session].onAnyMessage(function (message) {
                            console.log("[" + session + "]: Mensagem Recebida: \nTelefone: ' " + message.from + ", Mensagem: " + message.body);
                            message.session = session;
                            req.io.emit('received-message', { response: message });
                        });

                    case 2:
                    case "end":
                        return _context6.stop();
                }
            }
        }, _callee6, this);
    }));

    return function listenMessages(_x17, _x18, _x19) {
        return _ref6.apply(this, arguments);
    };
}();

var _SessionUtil = require("./SessionUtil");

var _wppconnect = require("@wppconnect-team/wppconnect");

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var chromiumArgs = ['--disable-web-security', '--no-sandbox', '--disable-web-security', '--aggressive-cache-discard', '--disable-cache', '--disable-application-cache', '--disable-offline-load-stale-cache', '--disk-cache-size=0', '--disable-background-networking', '--disable-default-apps', '--disable-extensions', '--disable-sync', '--disable-translate', '--hide-scrollbars', '--metrics-recording-only', '--mute-audio', '--no-first-run', '--safebrowsing-disable-auto-update', '--ignore-certificate-errors', '--ignore-ssl-errors', '--ignore-certificate-errors-spki-list'];

function exportQR(req, res, qrCode, session) {
    qrCode = qrCode.replace('data:image/png;base64,', '');
    var imageBuffer = Buffer.from(qrCode, 'base64');

    _fs2.default.writeFileSync(session + ".png", imageBuffer);

    req.io.emit('qrCode', {
        data: 'data:image/png;base64,' + imageBuffer.toString('base64'),
        session: session
    });
}
//# sourceMappingURL=CreateSessionUtil.js.map