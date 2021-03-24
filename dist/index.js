'use strict';

var _dotenv = require('dotenv');

var _cors = require('cors');

var _cors2 = _interopRequireDefault(_cors);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _http = require('http');

var _socket = require('socket.io');

var _routes = require('./routes');

var _GetAllTokens = require('./util/GetAllTokens');

var _GetAllTokens2 = _interopRequireDefault(_GetAllTokens);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(0, _dotenv.config)(); // DotEnv
var app = (0, _express2.default)();
var PORT = process.env.PORT || 21465;
//Caso sua aplicação fique em algum server
//o process.env.PORT vai pegar automaticamente a porta recebida.

//SocketIO
var options = {
    cors: true,
    origins: ["*"]
};
var server = (0, _http.createServer)(app);
var io = new _socket.Server(server, options);

app.use((0, _cors2.default)()); //Aceita que nosso server seja acessado através de um website
app.use(_express2.default.json()); //Aceita requisições via JSON

app.use(function (req, res, next) {
    req.io = io;
    next();
});

//SocketIO
io.on('connection', function (sock) {
    console.log('ID: ' + sock.id + ' entrou');

    sock.on('event', function (data) {
        console.log(data);
    });

    sock.on('disconnect', function () {
        console.log('ID: ' + sock.id + ' saiu');
    });
});

app.use(_routes.routes);

server.listen(PORT);
console.log('O servidor est\xE1 rodando na porta ' + PORT);
//# sourceMappingURL=index.js.map