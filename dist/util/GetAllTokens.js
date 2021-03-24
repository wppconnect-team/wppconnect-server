'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _regenerator = require('babel-runtime/regenerator');

var _regenerator2 = _interopRequireDefault(_regenerator);

var _asyncToGenerator2 = require('babel-runtime/helpers/asyncToGenerator');

var _asyncToGenerator3 = _interopRequireDefault(_asyncToGenerator2);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _util = require('util');

var _util2 = _interopRequireDefault(_util);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var readdir = _util2.default.promisify(_fs2.default.readdir);

exports.default = function () {
    var _ref = (0, _asyncToGenerator3.default)( /*#__PURE__*/_regenerator2.default.mark(function _callee() {
        var filenameArray, files;
        return _regenerator2.default.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        filenameArray = [];
                        _context.prev = 1;
                        _context.next = 4;
                        return readdir(_path2.default.resolve(__dirname, '..', '..', 'tokens'));

                    case 4:
                        files = _context.sent;

                        files.map(function (filename) {
                            filenameArray.push(filename);
                        });
                        _context.next = 11;
                        break;

                    case 8:
                        _context.prev = 8;
                        _context.t0 = _context['catch'](1);

                        console.log('Error getAllTokens() -> ', _context.t0);

                    case 11:
                        return _context.abrupt('return', filenameArray);

                    case 12:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this, [[1, 8]]);
    }));

    function getAllTokens() {
        return _ref.apply(this, arguments);
    }

    return getAllTokens;
}();
//# sourceMappingURL=GetAllTokens.js.map