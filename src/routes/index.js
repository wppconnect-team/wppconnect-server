import {Router} from "express";
import {encryptSession} from "../controller/EncryptController";
import * as MessageController from "../controller/MessageController";
import * as GroupController from "../controller/GroupController";
import * as DeviceController from "../controller/DeviceController";
import * as SessionController from "../controller/SessionController";
import verifyToken from "../middleware/auth";
import statusConnection from "../middleware/statusConnection";
import multer from "multer";
import uploadConfig from "../config/upload";

const upload = multer(uploadConfig);
const routes = new Router();

//Generate Token
routes.post("/api/:session/:secretkey/generate-token", encryptSession);

//Start All Sessions
routes.post("/api/:secretkey/start-all", SessionController.startAllSessions);

//Sessions
routes.get("/api/:session/show-all-sessions", verifyToken, statusConnection, SessionController.showAllSessions);
routes.post("/api/:session/start-session", verifyToken, SessionController.startSession);
routes.post("/api/:session/close-session", verifyToken, statusConnection, SessionController.closeSession);
routes.get("/api/:session/check-connection-session", verifyToken, SessionController.checkConnectionSession);

//SendMessages
routes.post("/api/:session/send-message", verifyToken, statusConnection, MessageController.sendMessage);
routes.post("/api/:session/send-image", verifyToken, statusConnection, MessageController.sendImage);
routes.post("/api/:session/send-file", upload.single("file"), verifyToken, statusConnection, MessageController.sendFile);
routes.post("/api/:session/send-file-base64", verifyToken, statusConnection, MessageController.sendFile64);
routes.post("/api/:session/send-voice", verifyToken, statusConnection, MessageController.sendVoice);
routes.post("/api/:session/send-status", verifyToken, statusConnection, MessageController.sendStatusText);
routes.post("/api/:session/send-link-preview", verifyToken, statusConnection, MessageController.sendLinkPreview);
routes.post("/api/:session/send-location", verifyToken, statusConnection, MessageController.sendLocation);

// Group Functions
routes.post("/api/:session/create-group", verifyToken, statusConnection, GroupController.createGroup);
routes.post("/api/:session/leave-group", verifyToken, statusConnection, GroupController.leaveGroup);
routes.post("/api/:session/join-code", verifyToken, statusConnection, GroupController.joinGroupByCode);
routes.post("/api/:session/group-members", verifyToken, statusConnection, GroupController.getGroupMembers);
routes.post("/api/:session/add-participant-group", verifyToken, statusConnection, GroupController.addParticipant);
routes.post("/api/:session/remove-participant-group", verifyToken, statusConnection, GroupController.removeParticipant);
routes.post("/api/:session/promote-participant-group", verifyToken, statusConnection, GroupController.promoteParticipant);
routes.post("/api/:session/demote-participant-group", verifyToken, statusConnection, GroupController.demoteParticipant);
routes.post("/api/:session/group-admins", verifyToken, statusConnection, GroupController.getGroupAdmins);
routes.post("/api/:session/group-invite-link", verifyToken, statusConnection, GroupController.getGroupInviteLink);

// Device Functions
routes.post("/api/:session/change-username", verifyToken, statusConnection, DeviceController.setProfileName);
routes.get("/api/:session/show-all-contacts", verifyToken, statusConnection, DeviceController.showAllContacts);
routes.get("/api/:session/show-all-chats", verifyToken, statusConnection, DeviceController.getAllChats);
routes.post("/api/:session/show-all-groups", verifyToken, statusConnection, DeviceController.getAllGroups);
routes.post("/api/:session/show-all-blocklist", verifyToken, statusConnection, DeviceController.getBlockList);
routes.post("/api/:session/get-chat-by-id", verifyToken, statusConnection, DeviceController.getChatById);
routes.post("/api/:session/get-battery-level", verifyToken, statusConnection, DeviceController.getBatteryLevel);
routes.post("/api/:session/delete-chat", verifyToken, statusConnection, DeviceController.deleteChat);
routes.post("/api/:session/clear-chat", verifyToken, statusConnection, DeviceController.clearChat);
routes.post("/api/:session/archive-chat", verifyToken, statusConnection, DeviceController.archiveChat);
routes.post("/api/:session/delete-message", verifyToken, statusConnection, DeviceController.deleteMessage);
routes.post("/api/:session/mark-unseen-contact", verifyToken, statusConnection, DeviceController.markUnseenMessage);
routes.post("/api/:session/block-contact", verifyToken, statusConnection, DeviceController.blockContact);
routes.post("/api/:session/unblock-contact", verifyToken, statusConnection, DeviceController.unblockContact);
routes.post("/api/:session/get-host-device", verifyToken, statusConnection, DeviceController.getHostDevice);
routes.post("/api/:session/forward-messages", verifyToken, statusConnection, DeviceController.forwardMessages);
routes.post("/api/:session/pin-chat", verifyToken, statusConnection, DeviceController.pinChat);
routes.post("/api/:session/change-privacy-group", verifyToken, statusConnection, DeviceController.changePrivacyGroup);
routes.post('/api/:session/download-media', verifyToken, statusConnection, SessionController.downloadMediaByMessage);

export default routes;