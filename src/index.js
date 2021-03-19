'use strict';
require('dotenv').config()
const cors = require('cors');
const express = require('express');
const app = express();

const options = {
    cors: true,
    origins: ["*"],
}
const server = require('http').Server(app);
const io = require('socket.io')(server, options);

const PORT = 21465;

app.use(cors());
app.use(express.json())

app.use((req, res, next) => {
    req.io = io;
    next();
});

app.use(require('./routes'))

io.on('connection', sock => {
    console.log(`ID: ${sock.id} entrou`)

    sock.on('event', data => {
        console.log(data)
    });

    sock.on('disconnect', () => {
        console.log(`ID: ${sock.id} saiu`)
    });
});

server.listen(PORT);
console.log(`O servidor está rodando na porta ${PORT}`)