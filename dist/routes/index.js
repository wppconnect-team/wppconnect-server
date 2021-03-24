'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.routes = undefined;

var _express = require('express');

var _EncryptController = require('../controller/EncryptController');

var _MessageController = require('../controller/MessageController');

var _SessionController = require('../controller/SessionController');

var _GroupController = require('../controller/GroupController');

var _DeviceController = require('../controller/DeviceController');

var _auth = require('../middleware/auth');

var _auth2 = _interopRequireDefault(_auth);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var routes = exports.routes = new _express.Router();

//Generate Token
routes.get('/api/:session/generate-token', _EncryptController.encryptSession);

//Start All Sessions
routes.post('/api/start-all', _SessionController.startAllSessions);

//Sessions
routes.get('/api/:session/show-all-sessions', _auth2.default, _SessionController.showAllSessions);
routes.get('/api/:session/check-connection', _auth2.default, _SessionController.checkSessionConnected);
routes.get('/api/:session/start-session', _auth2.default, _SessionController.startSession);
routes.get('/api/:session/close-session', _auth2.default, _SessionController.closeSession);

//SendMessages
routes.post('/api/:session/send-message', _auth2.default, _MessageController.sendMessage);
routes.post('/api/:session/send-image', _auth2.default, _MessageController.sendImage);
routes.post('/api/:session/send-file', _auth2.default, _MessageController.sendFile);

// Group Functions
routes.post('/api/:session/create-group', _auth2.default, _GroupController.createGroup);
routes.post('/api/:session/join-code', _auth2.default, _GroupController.joinGroupByCode);

// Device Functions
routes.post('/api/:session/change-username', _auth2.default, _DeviceController.setProfileName);
routes.post('/api/:session/change-profile-image', _auth2.default, _DeviceController.setProfileImage);
routes.get('/api/:session/show-all-contacts', _auth2.default, _DeviceController.showAllContacts);
//# sourceMappingURL=index.js.map