const express = require('express')
const EncryptController = require('../controller/EncryptController')
const MessageController = require('../controller/MessageController')

const routes = new express.Router()

//Generate Token
routes.get('/api/generate-token', EncryptController.encryptSession)

//Sessions
routes.get('/api/:session/show-all-sessions', MessageController.showAllSessions)
routes.get('/api/:session/check-connection', MessageController.checkSessionConnected)
routes.post('/api/:session/start-session', MessageController.startSession)
routes.post('/api/:session/close-session', MessageController.closeSession)

//SendMessages
routes.post('/api/:session/send-message', MessageController.sendMessage)
routes.post('/api/:session/send-image', MessageController.sendImage)
routes.post('/api/:session/send-file', MessageController.sendFile)

// Group Functions
routes.post('/api/:session/create-group', MessageController.createGroup)
routes.post('/api/:session/join-code', MessageController.joinGroupByCode)

// Device Functions
routes.post('/api/:session/change-username', MessageController.setProfileName)
routes.post('/api/:session/change-profile-image', MessageController.setProfileImage)
routes.post('/api/:session/close-session', MessageController.setProfileImage)
routes.get('/api/:session/show-all-contacts', MessageController.showAllContacts)

module.exports = routes;