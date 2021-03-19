const express = require('express')
const EncryptController = require('../controller/EncryptController')
const MessageController = require('../controller/MessageController')
const auth = require('../middleware/auth')

const routes = new express.Router()

//Generate Token
routes.get('/api/:session/generate-token', EncryptController.encryptSession)

//Sessions
routes.get('/api/:session/show-all-sessions', auth.verifyToken, MessageController.showAllSessions)
routes.get('/api/:session/check-connection', auth.verifyToken, MessageController.checkSessionConnected)
routes.post('/api/:session/start-session', auth.verifyToken, MessageController.startSession)
routes.post('/api/:session/close-session', auth.verifyToken, MessageController.closeSession)

//SendMessages
routes.post('/api/:session/send-message', auth.verifyToken, MessageController.sendMessage)
routes.post('/api/:session/send-image', auth.verifyToken, MessageController.sendImage)
routes.post('/api/:session/send-file', auth.verifyToken, MessageController.sendFile)

// Group Functions
routes.post('/api/:session/create-group', auth.verifyToken, MessageController.createGroup)
routes.post('/api/:session/join-code', auth.verifyToken, MessageController.joinGroupByCode)

// Device Functions
routes.post('/api/:session/change-username', auth.verifyToken, MessageController.setProfileName)
routes.post('/api/:session/change-profile-image', auth.verifyToken, MessageController.setProfileImage)
routes.post('/api/:session/close-session', auth.verifyToken, MessageController.setProfileImage)
routes.get('/api/:session/show-all-contacts', auth.verifyToken, MessageController.showAllContacts)

module.exports = routes;
