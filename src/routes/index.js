import {Router} from 'express';
import {encryptSession} from '../controller/EncryptController';
import {sendFile, sendImage, sendMessage} from '../controller/MessageController';
import {
    checkSessionConnected,
    closeSession,
    showAllSessions,
    startAllSessions,
    startSession
} from '../controller/SessionController';
import {createGroup, joinGroupByCode} from "../controller/GroupController";
import {setProfileImage, setProfileName, showAllContacts} from "../controller/DeviceController";
import verifyToken from '../middleware/auth';

export const routes = new Router();

//Generate Token
routes.get('/api/:session/generate-token', encryptSession);

//Start All Sessions
routes.post('/api/start-all', startAllSessions);

//Sessions
routes.get('/api/:session/show-all-sessions', verifyToken, showAllSessions);
routes.get('/api/:session/check-connection', verifyToken, checkSessionConnected);
routes.get('/api/:session/start-session', verifyToken, startSession);
routes.get('/api/:session/close-session', verifyToken, closeSession);

//SendMessages
routes.post('/api/:session/send-message', verifyToken, sendMessage);
routes.post('/api/:session/send-image', verifyToken, sendImage);
routes.post('/api/:session/send-file', verifyToken, sendFile);

// Group Functions
routes.post('/api/:session/create-group', verifyToken, createGroup);
routes.post('/api/:session/join-code', verifyToken, joinGroupByCode);

// Device Functions
routes.post('/api/:session/change-username', verifyToken, setProfileName);
routes.post('/api/:session/change-profile-image', verifyToken, setProfileImage);
routes.get('/api/:session/show-all-contacts', verifyToken, showAllContacts);
