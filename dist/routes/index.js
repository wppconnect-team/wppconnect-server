"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;














var _express = require("express");
var _multer = _interopRequireDefault(require("multer"));
var _swaggerUiExpress = _interopRequireDefault(require("swagger-ui-express"));

var _upload = _interopRequireDefault(require("../config/upload"));
var CatalogController = _interopRequireWildcard(require("../controller/catalogController"));
var CepController = _interopRequireWildcard(require("../controller/cepController"));
var CommunityController = _interopRequireWildcard(require("../controller/communityController"));
var DeviceController = _interopRequireWildcard(require("../controller/deviceController"));
var _encryptController = require("../controller/encryptController");
var GroupController = _interopRequireWildcard(require("../controller/groupController"));
var LabelsController = _interopRequireWildcard(require("../controller/labelsController"));
var MessageController = _interopRequireWildcard(require("../controller/messageController"));
var MiscController = _interopRequireWildcard(require("../controller/miscController"));
var OrderController = _interopRequireWildcard(require("../controller/orderController"));
var SessionController = _interopRequireWildcard(require("../controller/sessionController"));
var StatusController = _interopRequireWildcard(require("../controller/statusController"));
var _auth = _interopRequireDefault(require("../middleware/auth"));
var HealthCheck = _interopRequireWildcard(require("../middleware/healthCheck"));
var prometheusRegister = _interopRequireWildcard(require("../middleware/instrumentation"));
var _statusConnection = _interopRequireDefault(require("../middleware/statusConnection"));
var _swagger = _interopRequireDefault(require("../swagger.json"));function _getRequireWildcardCache(e) {if ("function" != typeof WeakMap) return null;var r = new WeakMap(),t = new WeakMap();return (_getRequireWildcardCache = function (e) {return e ? t : r;})(e);}function _interopRequireWildcard(e, r) {if (!r && e && e.__esModule) return e;if (null === e || "object" != typeof e && "function" != typeof e) return { default: e };var t = _getRequireWildcardCache(r);if (t && t.has(e)) return t.get(e);var n = { __proto__: null },a = Object.defineProperty && Object.getOwnPropertyDescriptor;for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) {var i = a ? Object.getOwnPropertyDescriptor(e, u) : null;i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u];}return n.default = e, t && t.set(e, n), n;} /*
 * Copyright 2021 WPPConnect Team
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const upload = (0, _multer.default)(_upload.default);const routes = (0, _express.Router)(); // Generate Token
routes.post('/api/:session/:secretkey/generate-token', _encryptController.encryptSession); // All Sessions
routes.get('/api/:secretkey/show-all-sessions', SessionController.showAllSessions);routes.post('/api/:secretkey/start-all', SessionController.startAllSessions); // Sessions
routes.get('/api/:session/check-connection-session',
_auth.default,
SessionController.checkConnectionSession
);
routes.get(
  '/api/:session/get-media-by-message/:messageId',
  _auth.default,
  SessionController.getMediaByMessage
);
routes.get(
  '/api/:session/get-platform-from-message/:messageId',
  _auth.default,
  DeviceController.getPlatformFromMessage
);
routes.get(
  '/api/:session/qrcode-session',
  _auth.default,
  SessionController.getQrCode
);
routes.post(
  '/api/:session/start-session',
  _auth.default,
  SessionController.startSession
);
routes.post(
  '/api/:session/logout-session',
  _auth.default,
  _statusConnection.default,
  SessionController.logOutSession
);
routes.post(
  '/api/:session/:secretkey/clear-session-data',
  MiscController.clearSessionData
);
routes.post(
  '/api/:session/close-session',
  _auth.default,
  SessionController.closeSession
);
routes.post(
  '/api/:session/subscribe-presence',
  _auth.default,
  SessionController.subscribePresence
);
routes.post(
  '/api/:session/download-media',
  _auth.default,
  _statusConnection.default,
  SessionController.downloadMediaByMessage
);

// CEP
routes.get('/api/cep/:cep', CepController.getCep);
routes.get('/api/postalcode/:code', CepController.getPostalCode);

// Messages
routes.post(
  '/api/:session/send-message',
  _auth.default,
  _statusConnection.default,
  MessageController.sendMessage
);
routes.post(
  '/api/:session/send-messages',
  _auth.default,
  _statusConnection.default,
  MessageController.sendMessages
);
routes.post(
  '/api/:session/send-image',
  upload.single('file'),
  _auth.default,
  _statusConnection.default,
  MessageController.sendFile
);
routes.post(
  '/api/:session/send-sticker',
  upload.single('file'),
  _auth.default,
  _statusConnection.default,
  MessageController.sendImageAsSticker
);
routes.post(
  '/api/:session/send-sticker-gif',
  upload.single('file'),
  _auth.default,
  _statusConnection.default,
  MessageController.sendImageAsStickerGif
);
routes.post(
  '/api/:session/send-reply',
  _auth.default,
  _statusConnection.default,
  MessageController.replyMessage
);
routes.post(
  '/api/:session/send-file',
  upload.single('file'),
  _auth.default,
  _statusConnection.default,
  MessageController.sendFile
);
routes.post(
  '/api/:session/send-file-base64',
  _auth.default,
  _statusConnection.default,
  MessageController.sendFile
);
routes.post(
  '/api/:session/send-voice',
  _auth.default,
  _statusConnection.default,
  MessageController.sendVoice
);
routes.post(
  '/api/:session/send-voice-base64',
  _auth.default,
  _statusConnection.default,
  MessageController.sendVoice64
);
routes.get(
  '/api/:session/status-session',
  _auth.default,
  SessionController.getSessionState
);
routes.post(
  '/api/:session/send-status',
  _auth.default,
  _statusConnection.default,
  MessageController.sendStatusText
);
routes.post(
  '/api/:session/send-link-preview',
  _auth.default,
  _statusConnection.default,
  MessageController.sendLinkPreview
);
routes.post(
  '/api/:session/send-location',
  _auth.default,
  _statusConnection.default,
  MessageController.sendLocation
);
routes.post(
  '/api/:session/send-mentioned',
  _auth.default,
  _statusConnection.default,
  MessageController.sendMentioned
);
routes.post(
  '/api/:session/send-buttons',
  _auth.default,
  _statusConnection.default,
  MessageController.sendButtons
);
routes.post(
  '/api/:session/send-list-message',
  _auth.default,
  _statusConnection.default,
  MessageController.sendListMessage
);
routes.post(
  '/api/:session/send-poll-message',
  _auth.default,
  _statusConnection.default,
  MessageController.sendPollMessage
);

// Group
routes.get(
  '/api/:session/all-broadcast-list',
  _auth.default,
  _statusConnection.default,
  GroupController.getAllBroadcastList
);
routes.get(
  '/api/:session/all-groups',
  _auth.default,
  _statusConnection.default,
  GroupController.getAllGroups
);
routes.get(
  '/api/:session/group-members/:groupId',
  _auth.default,
  _statusConnection.default,
  GroupController.getGroupMembers
);
routes.get(
  '/api/:session/group-admins/:groupId',
  _auth.default,
  _statusConnection.default,
  GroupController.getGroupAdmins
);
routes.get(
  '/api/:session/group-invite-link/:groupId',
  _auth.default,
  _statusConnection.default,
  GroupController.getGroupInviteLink
);
routes.get(
  '/api/:session/group-revoke-link/:groupId',
  _auth.default,
  _statusConnection.default,
  GroupController.revokeGroupInviteLink
);
routes.get(
  '/api/:session/group-members-ids/:groupId',
  _auth.default,
  _statusConnection.default,
  GroupController.getGroupMembersIds
);
routes.post(
  '/api/:session/create-group',
  _auth.default,
  _statusConnection.default,
  GroupController.createGroup
);
routes.post(
  '/api/:session/leave-group',
  _auth.default,
  _statusConnection.default,
  GroupController.leaveGroup
);
routes.post(
  '/api/:session/join-code',
  _auth.default,
  _statusConnection.default,
  GroupController.joinGroupByCode
);
routes.post(
  '/api/:session/add-participant-group',
  _auth.default,
  _statusConnection.default,
  GroupController.addParticipant
);
routes.post(
  '/api/:session/remove-participant-group',
  _auth.default,
  _statusConnection.default,
  GroupController.removeParticipant
);
routes.post(
  '/api/:session/promote-participant-group',
  _auth.default,
  _statusConnection.default,
  GroupController.promoteParticipant
);
routes.post(
  '/api/:session/demote-participant-group',
  _auth.default,
  _statusConnection.default,
  GroupController.demoteParticipant
);
routes.post(
  '/api/:session/group-info-from-invite-link',
  _auth.default,
  _statusConnection.default,
  GroupController.getGroupInfoFromInviteLink
);
routes.post(
  '/api/:session/group-description',
  _auth.default,
  _statusConnection.default,
  GroupController.setGroupDescription
);
routes.post(
  '/api/:session/group-property',
  _auth.default,
  _statusConnection.default,
  GroupController.setGroupProperty
);
routes.post(
  '/api/:session/group-subject',
  _auth.default,
  _statusConnection.default,
  GroupController.setGroupSubject
);
routes.post(
  '/api/:session/messages-admins-only',
  _auth.default,
  _statusConnection.default,
  GroupController.setMessagesAdminsOnly
);
routes.post(
  '/api/:session/group-pic',
  upload.single('file'),
  _auth.default,
  _statusConnection.default,
  GroupController.setGroupProfilePic
);
routes.post(
  '/api/:session/change-privacy-group',
  _auth.default,
  _statusConnection.default,
  GroupController.changePrivacyGroup
);

// Chat
routes.get(
  '/api/:session/all-chats',
  _auth.default,
  _statusConnection.default,
  DeviceController.getAllChats
);
routes.post(
  '/api/:session/list-chats',
  _auth.default,
  _statusConnection.default,
  DeviceController.listChats
);

routes.get(
  '/api/:session/all-chats-archived',
  _auth.default,
  _statusConnection.default,
  DeviceController.getAllChatsArchiveds
);
routes.get(
  '/api/:session/all-chats-with-messages',
  _auth.default,
  _statusConnection.default,
  DeviceController.getAllChatsWithMessages
);
routes.get(
  '/api/:session/all-messages-in-chat/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.getAllMessagesInChat
);
routes.get(
  '/api/:session/all-new-messages',
  _auth.default,
  _statusConnection.default,
  DeviceController.getAllNewMessages
);
routes.get(
  '/api/:session/unread-messages',
  _auth.default,
  _statusConnection.default,
  DeviceController.getUnreadMessages
);
routes.get(
  '/api/:session/all-unread-messages',
  _auth.default,
  _statusConnection.default,
  DeviceController.getAllUnreadMessages
);
routes.get(
  '/api/:session/chat-by-id/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.getChatById
);
routes.get(
  '/api/:session/message-by-id/:messageId',
  _auth.default,
  _statusConnection.default,
  DeviceController.getMessageById
);
routes.get(
  '/api/:session/chat-is-online/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.getChatIsOnline
);
routes.get(
  '/api/:session/last-seen/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.getLastSeen
);
routes.get(
  '/api/:session/list-mutes/:type',
  _auth.default,
  _statusConnection.default,
  DeviceController.getListMutes
);
routes.get(
  '/api/:session/load-messages-in-chat/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.loadAndGetAllMessagesInChat
);
routes.get(
  '/api/:session/get-messages/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.getMessages
);

routes.post(
  '/api/:session/archive-chat',
  _auth.default,
  _statusConnection.default,
  DeviceController.archiveChat
);
routes.post(
  '/api/:session/archive-all-chats',
  _auth.default,
  _statusConnection.default,
  DeviceController.archiveAllChats
);
routes.post(
  '/api/:session/clear-chat',
  _auth.default,
  _statusConnection.default,
  DeviceController.clearChat
);
routes.post(
  '/api/:session/clear-all-chats',
  _auth.default,
  _statusConnection.default,
  DeviceController.clearAllChats
);
routes.post(
  '/api/:session/delete-chat',
  _auth.default,
  _statusConnection.default,
  DeviceController.deleteChat
);
routes.post(
  '/api/:session/delete-all-chats',
  _auth.default,
  _statusConnection.default,
  DeviceController.deleteAllChats
);
routes.post(
  '/api/:session/delete-message',
  _auth.default,
  _statusConnection.default,
  DeviceController.deleteMessage
);
routes.post(
  '/api/:session/react-message',
  _auth.default,
  _statusConnection.default,
  DeviceController.reactMessage
);
routes.post(
  '/api/:session/forward-messages',
  _auth.default,
  _statusConnection.default,
  DeviceController.forwardMessages
);
routes.post(
  '/api/:session/mark-unseen',
  _auth.default,
  _statusConnection.default,
  DeviceController.markUnseenMessage
);
routes.post(
  '/api/:session/pin-chat',
  _auth.default,
  _statusConnection.default,
  DeviceController.pinChat
);
routes.post(
  '/api/:session/contact-vcard',
  _auth.default,
  _statusConnection.default,
  DeviceController.sendContactVcard
);
routes.post(
  '/api/:session/send-mute',
  _auth.default,
  _statusConnection.default,
  DeviceController.sendMute
);
routes.post(
  '/api/:session/send-seen',
  _auth.default,
  _statusConnection.default,
  DeviceController.sendSeen
);
routes.post(
  '/api/:session/chat-state',
  _auth.default,
  _statusConnection.default,
  DeviceController.setChatState
);
routes.post(
  '/api/:session/temporary-messages',
  _auth.default,
  _statusConnection.default,
  DeviceController.setTemporaryMessages
);
routes.post(
  '/api/:session/typing',
  _auth.default,
  _statusConnection.default,
  DeviceController.setTyping
);
routes.post(
  '/api/:session/recording',
  _auth.default,
  _statusConnection.default,
  DeviceController.setRecording
);
routes.post(
  '/api/:session/star-message',
  _auth.default,
  _statusConnection.default,
  DeviceController.starMessage
);
routes.get(
  '/api/:session/reactions/:id',
  _auth.default,
  _statusConnection.default,
  DeviceController.getReactions
);
routes.get(
  '/api/:session/votes/:id',
  _auth.default,
  _statusConnection.default,
  DeviceController.getVotes
);
routes.post(
  '/api/:session/reject-call',
  _auth.default,
  _statusConnection.default,
  DeviceController.rejectCall
);

// Catalog
routes.get(
  '/api/:session/get-products',
  _auth.default,
  _statusConnection.default,
  CatalogController.getProducts
);
routes.get(
  '/api/:session/get-product-by-id',
  _auth.default,
  _statusConnection.default,
  CatalogController.getProductById
);
routes.post(
  '/api/:session/add-product',
  _auth.default,
  _statusConnection.default,
  CatalogController.addProduct
);
routes.post(
  '/api/:session/edit-product',
  _auth.default,
  _statusConnection.default,
  CatalogController.editProduct
);
routes.post(
  '/api/:session/del-products',
  _auth.default,
  _statusConnection.default,
  CatalogController.delProducts
);
routes.post(
  '/api/:session/change-product-image',
  _auth.default,
  _statusConnection.default,
  CatalogController.changeProductImage
);
routes.post(
  '/api/:session/add-product-image',
  _auth.default,
  _statusConnection.default,
  CatalogController.addProductImage
);
routes.post(
  '/api/:session/remove-product-image',
  _auth.default,
  _statusConnection.default,
  CatalogController.removeProductImage
);
routes.get(
  '/api/:session/get-collections',
  _auth.default,
  _statusConnection.default,
  CatalogController.getCollections
);
routes.post(
  '/api/:session/create-collection',
  _auth.default,
  _statusConnection.default,
  CatalogController.createCollection
);
routes.post(
  '/api/:session/edit-collection',
  _auth.default,
  _statusConnection.default,
  CatalogController.editCollection
);
routes.post(
  '/api/:session/del-collection',
  _auth.default,
  _statusConnection.default,
  CatalogController.deleteCollection
);
routes.post(
  '/api/:session/send-link-catalog',
  _auth.default,
  _statusConnection.default,
  CatalogController.sendLinkCatalog
);
routes.post(
  '/api/:session/set-product-visibility',
  _auth.default,
  _statusConnection.default,
  CatalogController.setProductVisibility
);
routes.post(
  '/api/:session/set-cart-enabled',
  _auth.default,
  _statusConnection.default,
  CatalogController.updateCartEnabled
);

// Status
routes.post(
  '/api/:session/send-text-storie',
  _auth.default,
  _statusConnection.default,
  StatusController.sendTextStorie
);
routes.post(
  '/api/:session/send-image-storie',
  upload.single('file'),
  _auth.default,
  _statusConnection.default,
  StatusController.sendImageStorie
);
routes.post(
  '/api/:session/send-video-storie',
  upload.single('file'),
  _auth.default,
  _statusConnection.default,
  StatusController.sendVideoStorie
);

// Labels
routes.post(
  '/api/:session/add-new-label',
  _auth.default,
  _statusConnection.default,
  LabelsController.addNewLabel
);
routes.post(
  '/api/:session/add-or-remove-label',
  _auth.default,
  _statusConnection.default,
  LabelsController.addOrRemoveLabels
);
routes.get(
  '/api/:session/get-all-labels',
  _auth.default,
  _statusConnection.default,
  LabelsController.getAllLabels
);
routes.put(
  '/api/:session/delete-all-labels',
  _auth.default,
  _statusConnection.default,
  LabelsController.deleteAllLabels
);
routes.put(
  '/api/:session/delete-label/:id',
  _auth.default,
  _statusConnection.default,
  LabelsController.deleteLabel
);

// Contact
routes.get(
  '/api/:session/check-number-status/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.checkNumberStatus
);
routes.get(
  '/api/:session/all-contacts',
  _auth.default,
  _statusConnection.default,
  DeviceController.getAllContacts
);
routes.get(
  '/api/:session/contact/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.getContact
);
routes.get(
  '/api/:session/profile/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.getNumberProfile
);
routes.get(
  '/api/:session/profile-pic/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.getProfilePicFromServer
);
routes.get(
  '/api/:session/profile-status/:phone',
  _auth.default,
  _statusConnection.default,
  DeviceController.getStatus
);

// Blocklist
routes.get(
  '/api/:session/blocklist',
  _auth.default,
  _statusConnection.default,
  DeviceController.getBlockList
);
routes.post(
  '/api/:session/block-contact',
  _auth.default,
  _statusConnection.default,
  DeviceController.blockContact
);
routes.post(
  '/api/:session/unblock-contact',
  _auth.default,
  _statusConnection.default,
  DeviceController.unblockContact
);

// Device
routes.get(
  '/api/:session/get-battery-level',
  _auth.default,
  _statusConnection.default,
  DeviceController.getBatteryLevel
);
routes.get(
  '/api/:session/host-device',
  _auth.default,
  _statusConnection.default,
  DeviceController.getHostDevice
);
routes.get(
  '/api/:session/get-phone-number',
  _auth.default,
  _statusConnection.default,
  DeviceController.getPhoneNumber
);

// Profile
routes.post(
  '/api/:session/set-profile-pic',
  upload.single('file'),
  _auth.default,
  _statusConnection.default,
  DeviceController.setProfilePic
);
routes.post(
  '/api/:session/profile-status',
  _auth.default,
  _statusConnection.default,
  DeviceController.setProfileStatus
);
routes.post(
  '/api/:session/change-username',
  _auth.default,
  _statusConnection.default,
  DeviceController.setProfileName
);

// Business
routes.post(
  '/api/:session/edit-business-profile',
  _auth.default,
  _statusConnection.default,
  SessionController.editBusinessProfile
);
routes.get(
  '/api/:session/get-business-profiles-products',
  _auth.default,
  _statusConnection.default,
  OrderController.getBusinessProfilesProducts
);
routes.get(
  '/api/:session/get-order-by-messageId',
  _auth.default,
  _statusConnection.default,
  OrderController.getOrderbyMsg
);
routes.get('/api/:secretkey/backup-sessions', MiscController.backupAllSessions);
routes.post(
  '/api/:secretkey/restore-sessions',
  upload.single('file'),
  MiscController.restoreAllSessions
);
routes.get(
  '/api/:session/take-screenshot',
  _auth.default,
  MiscController.takeScreenshot
);
routes.post('/api/:session/set-limit', MiscController.setLimit);

//Communitys
routes.post(
  '/api/:session/create-community',
  _auth.default,
  _statusConnection.default,
  CommunityController.createCommunity
);
routes.post(
  '/api/:session/deactivate-community',
  _auth.default,
  _statusConnection.default,
  CommunityController.deactivateCommunity
);
routes.post(
  '/api/:session/add-community-subgroup',
  _auth.default,
  _statusConnection.default,
  CommunityController.addSubgroupsCommunity
);
routes.post(
  '/api/:session/remove-community-subgroup',
  _auth.default,
  _statusConnection.default,
  CommunityController.removeSubgroupsCommunity
);
routes.post(
  '/api/:session/promote-community-participant',
  _auth.default,
  _statusConnection.default,
  CommunityController.promoteCommunityParticipant
);
routes.post(
  '/api/:session/demote-community-participant',
  _auth.default,
  _statusConnection.default,
  CommunityController.demoteCommunityParticipant
);
routes.get(
  '/api/:session/community-participants/:id',
  _auth.default,
  _statusConnection.default,
  CommunityController.getCommunityParticipants
);

routes.post('/api/:session/chatwoot', DeviceController.chatWoot);

// Api Doc
routes.use('/api-docs', _swaggerUiExpress.default.serve);
routes.get('/api-docs', _swaggerUiExpress.default.setup(_swagger.default));

//k8s
routes.get('/healthz', HealthCheck.healthz);
routes.get('/unhealthy', HealthCheck.unhealthy);

//Metrics Prometheus

routes.get('/metrics', prometheusRegister.metrics);var _default = exports.default =

routes;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfZXhwcmVzcyIsInJlcXVpcmUiLCJfbXVsdGVyIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsIl9zd2FnZ2VyVWlFeHByZXNzIiwiX3VwbG9hZCIsIkNhdGFsb2dDb250cm9sbGVyIiwiX2ludGVyb3BSZXF1aXJlV2lsZGNhcmQiLCJDZXBDb250cm9sbGVyIiwiQ29tbXVuaXR5Q29udHJvbGxlciIsIkRldmljZUNvbnRyb2xsZXIiLCJfZW5jcnlwdENvbnRyb2xsZXIiLCJHcm91cENvbnRyb2xsZXIiLCJMYWJlbHNDb250cm9sbGVyIiwiTWVzc2FnZUNvbnRyb2xsZXIiLCJNaXNjQ29udHJvbGxlciIsIk9yZGVyQ29udHJvbGxlciIsIlNlc3Npb25Db250cm9sbGVyIiwiU3RhdHVzQ29udHJvbGxlciIsIl9hdXRoIiwiSGVhbHRoQ2hlY2siLCJwcm9tZXRoZXVzUmVnaXN0ZXIiLCJfc3RhdHVzQ29ubmVjdGlvbiIsIl9zd2FnZ2VyIiwiX2dldFJlcXVpcmVXaWxkY2FyZENhY2hlIiwiZSIsIldlYWtNYXAiLCJyIiwidCIsIl9fZXNNb2R1bGUiLCJkZWZhdWx0IiwiaGFzIiwiZ2V0IiwibiIsIl9fcHJvdG9fXyIsImEiLCJPYmplY3QiLCJkZWZpbmVQcm9wZXJ0eSIsImdldE93blByb3BlcnR5RGVzY3JpcHRvciIsInUiLCJwcm90b3R5cGUiLCJoYXNPd25Qcm9wZXJ0eSIsImNhbGwiLCJpIiwic2V0IiwidXBsb2FkIiwibXVsdGVyIiwidXBsb2FkQ29uZmlnIiwicm91dGVzIiwiUm91dGVyIiwicG9zdCIsImVuY3J5cHRTZXNzaW9uIiwic2hvd0FsbFNlc3Npb25zIiwic3RhcnRBbGxTZXNzaW9ucyIsInZlcmlmeVRva2VuIiwiY2hlY2tDb25uZWN0aW9uU2Vzc2lvbiIsImdldE1lZGlhQnlNZXNzYWdlIiwiZ2V0UGxhdGZvcm1Gcm9tTWVzc2FnZSIsImdldFFyQ29kZSIsInN0YXJ0U2Vzc2lvbiIsInN0YXR1c0Nvbm5lY3Rpb24iLCJsb2dPdXRTZXNzaW9uIiwiY2xlYXJTZXNzaW9uRGF0YSIsImNsb3NlU2Vzc2lvbiIsInN1YnNjcmliZVByZXNlbmNlIiwiZG93bmxvYWRNZWRpYUJ5TWVzc2FnZSIsImdldENlcCIsImdldFBvc3RhbENvZGUiLCJzZW5kTWVzc2FnZSIsInNlbmRNZXNzYWdlcyIsInNpbmdsZSIsInNlbmRGaWxlIiwic2VuZEltYWdlQXNTdGlja2VyIiwic2VuZEltYWdlQXNTdGlja2VyR2lmIiwicmVwbHlNZXNzYWdlIiwic2VuZFZvaWNlIiwic2VuZFZvaWNlNjQiLCJnZXRTZXNzaW9uU3RhdGUiLCJzZW5kU3RhdHVzVGV4dCIsInNlbmRMaW5rUHJldmlldyIsInNlbmRMb2NhdGlvbiIsInNlbmRNZW50aW9uZWQiLCJzZW5kQnV0dG9ucyIsInNlbmRMaXN0TWVzc2FnZSIsInNlbmRQb2xsTWVzc2FnZSIsImdldEFsbEJyb2FkY2FzdExpc3QiLCJnZXRBbGxHcm91cHMiLCJnZXRHcm91cE1lbWJlcnMiLCJnZXRHcm91cEFkbWlucyIsImdldEdyb3VwSW52aXRlTGluayIsInJldm9rZUdyb3VwSW52aXRlTGluayIsImdldEdyb3VwTWVtYmVyc0lkcyIsImNyZWF0ZUdyb3VwIiwibGVhdmVHcm91cCIsImpvaW5Hcm91cEJ5Q29kZSIsImFkZFBhcnRpY2lwYW50IiwicmVtb3ZlUGFydGljaXBhbnQiLCJwcm9tb3RlUGFydGljaXBhbnQiLCJkZW1vdGVQYXJ0aWNpcGFudCIsImdldEdyb3VwSW5mb0Zyb21JbnZpdGVMaW5rIiwic2V0R3JvdXBEZXNjcmlwdGlvbiIsInNldEdyb3VwUHJvcGVydHkiLCJzZXRHcm91cFN1YmplY3QiLCJzZXRNZXNzYWdlc0FkbWluc09ubHkiLCJzZXRHcm91cFByb2ZpbGVQaWMiLCJjaGFuZ2VQcml2YWN5R3JvdXAiLCJnZXRBbGxDaGF0cyIsImxpc3RDaGF0cyIsImdldEFsbENoYXRzQXJjaGl2ZWRzIiwiZ2V0QWxsQ2hhdHNXaXRoTWVzc2FnZXMiLCJnZXRBbGxNZXNzYWdlc0luQ2hhdCIsImdldEFsbE5ld01lc3NhZ2VzIiwiZ2V0VW5yZWFkTWVzc2FnZXMiLCJnZXRBbGxVbnJlYWRNZXNzYWdlcyIsImdldENoYXRCeUlkIiwiZ2V0TWVzc2FnZUJ5SWQiLCJnZXRDaGF0SXNPbmxpbmUiLCJnZXRMYXN0U2VlbiIsImdldExpc3RNdXRlcyIsImxvYWRBbmRHZXRBbGxNZXNzYWdlc0luQ2hhdCIsImdldE1lc3NhZ2VzIiwiYXJjaGl2ZUNoYXQiLCJhcmNoaXZlQWxsQ2hhdHMiLCJjbGVhckNoYXQiLCJjbGVhckFsbENoYXRzIiwiZGVsZXRlQ2hhdCIsImRlbGV0ZUFsbENoYXRzIiwiZGVsZXRlTWVzc2FnZSIsInJlYWN0TWVzc2FnZSIsImZvcndhcmRNZXNzYWdlcyIsIm1hcmtVbnNlZW5NZXNzYWdlIiwicGluQ2hhdCIsInNlbmRDb250YWN0VmNhcmQiLCJzZW5kTXV0ZSIsInNlbmRTZWVuIiwic2V0Q2hhdFN0YXRlIiwic2V0VGVtcG9yYXJ5TWVzc2FnZXMiLCJzZXRUeXBpbmciLCJzZXRSZWNvcmRpbmciLCJzdGFyTWVzc2FnZSIsImdldFJlYWN0aW9ucyIsImdldFZvdGVzIiwicmVqZWN0Q2FsbCIsImdldFByb2R1Y3RzIiwiZ2V0UHJvZHVjdEJ5SWQiLCJhZGRQcm9kdWN0IiwiZWRpdFByb2R1Y3QiLCJkZWxQcm9kdWN0cyIsImNoYW5nZVByb2R1Y3RJbWFnZSIsImFkZFByb2R1Y3RJbWFnZSIsInJlbW92ZVByb2R1Y3RJbWFnZSIsImdldENvbGxlY3Rpb25zIiwiY3JlYXRlQ29sbGVjdGlvbiIsImVkaXRDb2xsZWN0aW9uIiwiZGVsZXRlQ29sbGVjdGlvbiIsInNlbmRMaW5rQ2F0YWxvZyIsInNldFByb2R1Y3RWaXNpYmlsaXR5IiwidXBkYXRlQ2FydEVuYWJsZWQiLCJzZW5kVGV4dFN0b3JpZSIsInNlbmRJbWFnZVN0b3JpZSIsInNlbmRWaWRlb1N0b3JpZSIsImFkZE5ld0xhYmVsIiwiYWRkT3JSZW1vdmVMYWJlbHMiLCJnZXRBbGxMYWJlbHMiLCJwdXQiLCJkZWxldGVBbGxMYWJlbHMiLCJkZWxldGVMYWJlbCIsImNoZWNrTnVtYmVyU3RhdHVzIiwiZ2V0QWxsQ29udGFjdHMiLCJnZXRDb250YWN0IiwiZ2V0TnVtYmVyUHJvZmlsZSIsImdldFByb2ZpbGVQaWNGcm9tU2VydmVyIiwiZ2V0U3RhdHVzIiwiZ2V0QmxvY2tMaXN0IiwiYmxvY2tDb250YWN0IiwidW5ibG9ja0NvbnRhY3QiLCJnZXRCYXR0ZXJ5TGV2ZWwiLCJnZXRIb3N0RGV2aWNlIiwiZ2V0UGhvbmVOdW1iZXIiLCJzZXRQcm9maWxlUGljIiwic2V0UHJvZmlsZVN0YXR1cyIsInNldFByb2ZpbGVOYW1lIiwiZWRpdEJ1c2luZXNzUHJvZmlsZSIsImdldEJ1c2luZXNzUHJvZmlsZXNQcm9kdWN0cyIsImdldE9yZGVyYnlNc2ciLCJiYWNrdXBBbGxTZXNzaW9ucyIsInJlc3RvcmVBbGxTZXNzaW9ucyIsInRha2VTY3JlZW5zaG90Iiwic2V0TGltaXQiLCJjcmVhdGVDb21tdW5pdHkiLCJkZWFjdGl2YXRlQ29tbXVuaXR5IiwiYWRkU3ViZ3JvdXBzQ29tbXVuaXR5IiwicmVtb3ZlU3ViZ3JvdXBzQ29tbXVuaXR5IiwicHJvbW90ZUNvbW11bml0eVBhcnRpY2lwYW50IiwiZGVtb3RlQ29tbXVuaXR5UGFydGljaXBhbnQiLCJnZXRDb21tdW5pdHlQYXJ0aWNpcGFudHMiLCJjaGF0V29vdCIsInVzZSIsInN3YWdnZXJVaSIsInNlcnZlIiwic2V0dXAiLCJzd2FnZ2VyRG9jdW1lbnQiLCJoZWFsdGh6IiwidW5oZWFsdGh5IiwibWV0cmljcyIsIl9kZWZhdWx0IiwiZXhwb3J0cyJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9yb3V0ZXMvaW5kZXgudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLypcclxuICogQ29weXJpZ2h0IDIwMjEgV1BQQ29ubmVjdCBUZWFtXHJcbiAqXHJcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XHJcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cclxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XHJcbiAqXHJcbiAqICAgICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcclxuICpcclxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxyXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXHJcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxyXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXHJcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxyXG4gKi9cclxuaW1wb3J0IHsgUm91dGVyIH0gZnJvbSAnZXhwcmVzcyc7XHJcbmltcG9ydCBtdWx0ZXIgZnJvbSAnbXVsdGVyJztcclxuaW1wb3J0IHN3YWdnZXJVaSBmcm9tICdzd2FnZ2VyLXVpLWV4cHJlc3MnO1xyXG5cclxuaW1wb3J0IHVwbG9hZENvbmZpZyBmcm9tICcuLi9jb25maWcvdXBsb2FkJztcclxuaW1wb3J0ICogYXMgQ2F0YWxvZ0NvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlci9jYXRhbG9nQ29udHJvbGxlcic7XHJcbmltcG9ydCAqIGFzIENlcENvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlci9jZXBDb250cm9sbGVyJztcclxuaW1wb3J0ICogYXMgQ29tbXVuaXR5Q29udHJvbGxlciBmcm9tICcuLi9jb250cm9sbGVyL2NvbW11bml0eUNvbnRyb2xsZXInO1xyXG5pbXBvcnQgKiBhcyBEZXZpY2VDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXIvZGV2aWNlQ29udHJvbGxlcic7XHJcbmltcG9ydCB7IGVuY3J5cHRTZXNzaW9uIH0gZnJvbSAnLi4vY29udHJvbGxlci9lbmNyeXB0Q29udHJvbGxlcic7XHJcbmltcG9ydCAqIGFzIEdyb3VwQ29udHJvbGxlciBmcm9tICcuLi9jb250cm9sbGVyL2dyb3VwQ29udHJvbGxlcic7XHJcbmltcG9ydCAqIGFzIExhYmVsc0NvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlci9sYWJlbHNDb250cm9sbGVyJztcclxuaW1wb3J0ICogYXMgTWVzc2FnZUNvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlci9tZXNzYWdlQ29udHJvbGxlcic7XHJcbmltcG9ydCAqIGFzIE1pc2NDb250cm9sbGVyIGZyb20gJy4uL2NvbnRyb2xsZXIvbWlzY0NvbnRyb2xsZXInO1xyXG5pbXBvcnQgKiBhcyBPcmRlckNvbnRyb2xsZXIgZnJvbSAnLi4vY29udHJvbGxlci9vcmRlckNvbnRyb2xsZXInO1xyXG5pbXBvcnQgKiBhcyBTZXNzaW9uQ29udHJvbGxlciBmcm9tICcuLi9jb250cm9sbGVyL3Nlc3Npb25Db250cm9sbGVyJztcclxuaW1wb3J0ICogYXMgU3RhdHVzQ29udHJvbGxlciBmcm9tICcuLi9jb250cm9sbGVyL3N0YXR1c0NvbnRyb2xsZXInO1xyXG5pbXBvcnQgdmVyaWZ5VG9rZW4gZnJvbSAnLi4vbWlkZGxld2FyZS9hdXRoJztcclxuaW1wb3J0ICogYXMgSGVhbHRoQ2hlY2sgZnJvbSAnLi4vbWlkZGxld2FyZS9oZWFsdGhDaGVjayc7XHJcbmltcG9ydCAqIGFzIHByb21ldGhldXNSZWdpc3RlciBmcm9tICcuLi9taWRkbGV3YXJlL2luc3RydW1lbnRhdGlvbic7XHJcbmltcG9ydCBzdGF0dXNDb25uZWN0aW9uIGZyb20gJy4uL21pZGRsZXdhcmUvc3RhdHVzQ29ubmVjdGlvbic7XHJcbmltcG9ydCBzd2FnZ2VyRG9jdW1lbnQgZnJvbSAnLi4vc3dhZ2dlci5qc29uJztcclxuXHJcbmNvbnN0IHVwbG9hZCA9IG11bHRlcih1cGxvYWRDb25maWcgYXMgYW55KTtcclxuY29uc3Qgcm91dGVzID0gUm91dGVyKCk7XHJcblxyXG4vLyBHZW5lcmF0ZSBUb2tlblxyXG5yb3V0ZXMucG9zdCgnL2FwaS86c2Vzc2lvbi86c2VjcmV0a2V5L2dlbmVyYXRlLXRva2VuJywgZW5jcnlwdFNlc3Npb24pO1xyXG5cclxuLy8gQWxsIFNlc3Npb25zXHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlY3JldGtleS9zaG93LWFsbC1zZXNzaW9ucycsXHJcbiAgU2Vzc2lvbkNvbnRyb2xsZXIuc2hvd0FsbFNlc3Npb25zXHJcbik7XHJcbnJvdXRlcy5wb3N0KCcvYXBpLzpzZWNyZXRrZXkvc3RhcnQtYWxsJywgU2Vzc2lvbkNvbnRyb2xsZXIuc3RhcnRBbGxTZXNzaW9ucyk7XHJcblxyXG4vLyBTZXNzaW9uc1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2NoZWNrLWNvbm5lY3Rpb24tc2Vzc2lvbicsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgU2Vzc2lvbkNvbnRyb2xsZXIuY2hlY2tDb25uZWN0aW9uU2Vzc2lvblxyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2dldC1tZWRpYS1ieS1tZXNzYWdlLzptZXNzYWdlSWQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIFNlc3Npb25Db250cm9sbGVyLmdldE1lZGlhQnlNZXNzYWdlXHJcbik7XHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vZ2V0LXBsYXRmb3JtLWZyb20tbWVzc2FnZS86bWVzc2FnZUlkJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBEZXZpY2VDb250cm9sbGVyLmdldFBsYXRmb3JtRnJvbU1lc3NhZ2VcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9xcmNvZGUtc2Vzc2lvbicsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgU2Vzc2lvbkNvbnRyb2xsZXIuZ2V0UXJDb2RlXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3N0YXJ0LXNlc3Npb24nLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIFNlc3Npb25Db250cm9sbGVyLnN0YXJ0U2Vzc2lvblxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9sb2dvdXQtc2Vzc2lvbicsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBTZXNzaW9uQ29udHJvbGxlci5sb2dPdXRTZXNzaW9uXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uLzpzZWNyZXRrZXkvY2xlYXItc2Vzc2lvbi1kYXRhJyxcclxuICBNaXNjQ29udHJvbGxlci5jbGVhclNlc3Npb25EYXRhXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2Nsb3NlLXNlc3Npb24nLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIFNlc3Npb25Db250cm9sbGVyLmNsb3NlU2Vzc2lvblxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zdWJzY3JpYmUtcHJlc2VuY2UnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIFNlc3Npb25Db250cm9sbGVyLnN1YnNjcmliZVByZXNlbmNlXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2Rvd25sb2FkLW1lZGlhJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIFNlc3Npb25Db250cm9sbGVyLmRvd25sb2FkTWVkaWFCeU1lc3NhZ2VcclxuKTtcclxuXHJcbi8vIENFUFxyXG5yb3V0ZXMuZ2V0KCcvYXBpL2NlcC86Y2VwJywgQ2VwQ29udHJvbGxlci5nZXRDZXApO1xyXG5yb3V0ZXMuZ2V0KCcvYXBpL3Bvc3RhbGNvZGUvOmNvZGUnLCBDZXBDb250cm9sbGVyLmdldFBvc3RhbENvZGUpO1xyXG5cclxuLy8gTWVzc2FnZXNcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vc2VuZC1tZXNzYWdlJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIE1lc3NhZ2VDb250cm9sbGVyLnNlbmRNZXNzYWdlXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtbWVzc2FnZXMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgTWVzc2FnZUNvbnRyb2xsZXIuc2VuZE1lc3NhZ2VzXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtaW1hZ2UnLFxyXG4gIHVwbG9hZC5zaW5nbGUoJ2ZpbGUnKSxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIE1lc3NhZ2VDb250cm9sbGVyLnNlbmRGaWxlXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtc3RpY2tlcicsXHJcbiAgdXBsb2FkLnNpbmdsZSgnZmlsZScpLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgTWVzc2FnZUNvbnRyb2xsZXIuc2VuZEltYWdlQXNTdGlja2VyXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtc3RpY2tlci1naWYnLFxyXG4gIHVwbG9hZC5zaW5nbGUoJ2ZpbGUnKSxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIE1lc3NhZ2VDb250cm9sbGVyLnNlbmRJbWFnZUFzU3RpY2tlckdpZlxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zZW5kLXJlcGx5JyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIE1lc3NhZ2VDb250cm9sbGVyLnJlcGx5TWVzc2FnZVxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zZW5kLWZpbGUnLFxyXG4gIHVwbG9hZC5zaW5nbGUoJ2ZpbGUnKSxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIE1lc3NhZ2VDb250cm9sbGVyLnNlbmRGaWxlXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtZmlsZS1iYXNlNjQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgTWVzc2FnZUNvbnRyb2xsZXIuc2VuZEZpbGVcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vc2VuZC12b2ljZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBNZXNzYWdlQ29udHJvbGxlci5zZW5kVm9pY2VcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vc2VuZC12b2ljZS1iYXNlNjQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgTWVzc2FnZUNvbnRyb2xsZXIuc2VuZFZvaWNlNjRcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9zdGF0dXMtc2Vzc2lvbicsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgU2Vzc2lvbkNvbnRyb2xsZXIuZ2V0U2Vzc2lvblN0YXRlXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtc3RhdHVzJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIE1lc3NhZ2VDb250cm9sbGVyLnNlbmRTdGF0dXNUZXh0XHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtbGluay1wcmV2aWV3JyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIE1lc3NhZ2VDb250cm9sbGVyLnNlbmRMaW5rUHJldmlld1xyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zZW5kLWxvY2F0aW9uJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIE1lc3NhZ2VDb250cm9sbGVyLnNlbmRMb2NhdGlvblxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zZW5kLW1lbnRpb25lZCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBNZXNzYWdlQ29udHJvbGxlci5zZW5kTWVudGlvbmVkXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtYnV0dG9ucycsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBNZXNzYWdlQ29udHJvbGxlci5zZW5kQnV0dG9uc1xyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zZW5kLWxpc3QtbWVzc2FnZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBNZXNzYWdlQ29udHJvbGxlci5zZW5kTGlzdE1lc3NhZ2VcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vc2VuZC1wb2xsLW1lc3NhZ2UnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgTWVzc2FnZUNvbnRyb2xsZXIuc2VuZFBvbGxNZXNzYWdlXHJcbik7XHJcblxyXG4vLyBHcm91cFxyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2FsbC1icm9hZGNhc3QtbGlzdCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBHcm91cENvbnRyb2xsZXIuZ2V0QWxsQnJvYWRjYXN0TGlzdFxyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2FsbC1ncm91cHMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgR3JvdXBDb250cm9sbGVyLmdldEFsbEdyb3Vwc1xyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2dyb3VwLW1lbWJlcnMvOmdyb3VwSWQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgR3JvdXBDb250cm9sbGVyLmdldEdyb3VwTWVtYmVyc1xyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2dyb3VwLWFkbWlucy86Z3JvdXBJZCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBHcm91cENvbnRyb2xsZXIuZ2V0R3JvdXBBZG1pbnNcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9ncm91cC1pbnZpdGUtbGluay86Z3JvdXBJZCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBHcm91cENvbnRyb2xsZXIuZ2V0R3JvdXBJbnZpdGVMaW5rXHJcbik7XHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vZ3JvdXAtcmV2b2tlLWxpbmsvOmdyb3VwSWQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgR3JvdXBDb250cm9sbGVyLnJldm9rZUdyb3VwSW52aXRlTGlua1xyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2dyb3VwLW1lbWJlcnMtaWRzLzpncm91cElkJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIEdyb3VwQ29udHJvbGxlci5nZXRHcm91cE1lbWJlcnNJZHNcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vY3JlYXRlLWdyb3VwJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIEdyb3VwQ29udHJvbGxlci5jcmVhdGVHcm91cFxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9sZWF2ZS1ncm91cCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBHcm91cENvbnRyb2xsZXIubGVhdmVHcm91cFxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9qb2luLWNvZGUnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgR3JvdXBDb250cm9sbGVyLmpvaW5Hcm91cEJ5Q29kZVxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9hZGQtcGFydGljaXBhbnQtZ3JvdXAnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgR3JvdXBDb250cm9sbGVyLmFkZFBhcnRpY2lwYW50XHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3JlbW92ZS1wYXJ0aWNpcGFudC1ncm91cCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBHcm91cENvbnRyb2xsZXIucmVtb3ZlUGFydGljaXBhbnRcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vcHJvbW90ZS1wYXJ0aWNpcGFudC1ncm91cCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBHcm91cENvbnRyb2xsZXIucHJvbW90ZVBhcnRpY2lwYW50XHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2RlbW90ZS1wYXJ0aWNpcGFudC1ncm91cCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBHcm91cENvbnRyb2xsZXIuZGVtb3RlUGFydGljaXBhbnRcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vZ3JvdXAtaW5mby1mcm9tLWludml0ZS1saW5rJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIEdyb3VwQ29udHJvbGxlci5nZXRHcm91cEluZm9Gcm9tSW52aXRlTGlua1xyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9ncm91cC1kZXNjcmlwdGlvbicsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBHcm91cENvbnRyb2xsZXIuc2V0R3JvdXBEZXNjcmlwdGlvblxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9ncm91cC1wcm9wZXJ0eScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBHcm91cENvbnRyb2xsZXIuc2V0R3JvdXBQcm9wZXJ0eVxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9ncm91cC1zdWJqZWN0JyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIEdyb3VwQ29udHJvbGxlci5zZXRHcm91cFN1YmplY3RcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vbWVzc2FnZXMtYWRtaW5zLW9ubHknLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgR3JvdXBDb250cm9sbGVyLnNldE1lc3NhZ2VzQWRtaW5zT25seVxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9ncm91cC1waWMnLFxyXG4gIHVwbG9hZC5zaW5nbGUoJ2ZpbGUnKSxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIEdyb3VwQ29udHJvbGxlci5zZXRHcm91cFByb2ZpbGVQaWNcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vY2hhbmdlLXByaXZhY3ktZ3JvdXAnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgR3JvdXBDb250cm9sbGVyLmNoYW5nZVByaXZhY3lHcm91cFxyXG4pO1xyXG5cclxuLy8gQ2hhdFxyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2FsbC1jaGF0cycsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmdldEFsbENoYXRzXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2xpc3QtY2hhdHMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5saXN0Q2hhdHNcclxuKTtcclxuXHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vYWxsLWNoYXRzLWFyY2hpdmVkJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuZ2V0QWxsQ2hhdHNBcmNoaXZlZHNcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9hbGwtY2hhdHMtd2l0aC1tZXNzYWdlcycsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmdldEFsbENoYXRzV2l0aE1lc3NhZ2VzXHJcbik7XHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vYWxsLW1lc3NhZ2VzLWluLWNoYXQvOnBob25lJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuZ2V0QWxsTWVzc2FnZXNJbkNoYXRcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9hbGwtbmV3LW1lc3NhZ2VzJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuZ2V0QWxsTmV3TWVzc2FnZXNcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi91bnJlYWQtbWVzc2FnZXMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRVbnJlYWRNZXNzYWdlc1xyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2FsbC11bnJlYWQtbWVzc2FnZXMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRBbGxVbnJlYWRNZXNzYWdlc1xyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2NoYXQtYnktaWQvOnBob25lJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuZ2V0Q2hhdEJ5SWRcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9tZXNzYWdlLWJ5LWlkLzptZXNzYWdlSWQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRNZXNzYWdlQnlJZFxyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2NoYXQtaXMtb25saW5lLzpwaG9uZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmdldENoYXRJc09ubGluZVxyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2xhc3Qtc2Vlbi86cGhvbmUnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRMYXN0U2VlblxyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2xpc3QtbXV0ZXMvOnR5cGUnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRMaXN0TXV0ZXNcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9sb2FkLW1lc3NhZ2VzLWluLWNoYXQvOnBob25lJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIubG9hZEFuZEdldEFsbE1lc3NhZ2VzSW5DaGF0XHJcbik7XHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vZ2V0LW1lc3NhZ2VzLzpwaG9uZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmdldE1lc3NhZ2VzXHJcbik7XHJcblxyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9hcmNoaXZlLWNoYXQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5hcmNoaXZlQ2hhdFxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9hcmNoaXZlLWFsbC1jaGF0cycsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmFyY2hpdmVBbGxDaGF0c1xyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9jbGVhci1jaGF0JyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuY2xlYXJDaGF0XHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2NsZWFyLWFsbC1jaGF0cycsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmNsZWFyQWxsQ2hhdHNcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vZGVsZXRlLWNoYXQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5kZWxldGVDaGF0XHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2RlbGV0ZS1hbGwtY2hhdHMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5kZWxldGVBbGxDaGF0c1xyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9kZWxldGUtbWVzc2FnZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmRlbGV0ZU1lc3NhZ2VcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vcmVhY3QtbWVzc2FnZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLnJlYWN0TWVzc2FnZVxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9mb3J3YXJkLW1lc3NhZ2VzJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuZm9yd2FyZE1lc3NhZ2VzXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL21hcmstdW5zZWVuJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIubWFya1Vuc2Vlbk1lc3NhZ2VcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vcGluLWNoYXQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5waW5DaGF0XHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2NvbnRhY3QtdmNhcmQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5zZW5kQ29udGFjdFZjYXJkXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtbXV0ZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLnNlbmRNdXRlXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtc2VlbicsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLnNlbmRTZWVuXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2NoYXQtc3RhdGUnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5zZXRDaGF0U3RhdGVcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vdGVtcG9yYXJ5LW1lc3NhZ2VzJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuc2V0VGVtcG9yYXJ5TWVzc2FnZXNcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vdHlwaW5nJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuc2V0VHlwaW5nXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3JlY29yZGluZycsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLnNldFJlY29yZGluZ1xyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zdGFyLW1lc3NhZ2UnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5zdGFyTWVzc2FnZVxyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3JlYWN0aW9ucy86aWQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRSZWFjdGlvbnNcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi92b3Rlcy86aWQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRWb3Rlc1xyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9yZWplY3QtY2FsbCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLnJlamVjdENhbGxcclxuKTtcclxuXHJcbi8vIENhdGFsb2dcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9nZXQtcHJvZHVjdHMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ2F0YWxvZ0NvbnRyb2xsZXIuZ2V0UHJvZHVjdHNcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9nZXQtcHJvZHVjdC1ieS1pZCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBDYXRhbG9nQ29udHJvbGxlci5nZXRQcm9kdWN0QnlJZFxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9hZGQtcHJvZHVjdCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBDYXRhbG9nQ29udHJvbGxlci5hZGRQcm9kdWN0XHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2VkaXQtcHJvZHVjdCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBDYXRhbG9nQ29udHJvbGxlci5lZGl0UHJvZHVjdFxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9kZWwtcHJvZHVjdHMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ2F0YWxvZ0NvbnRyb2xsZXIuZGVsUHJvZHVjdHNcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vY2hhbmdlLXByb2R1Y3QtaW1hZ2UnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ2F0YWxvZ0NvbnRyb2xsZXIuY2hhbmdlUHJvZHVjdEltYWdlXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2FkZC1wcm9kdWN0LWltYWdlJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIENhdGFsb2dDb250cm9sbGVyLmFkZFByb2R1Y3RJbWFnZVxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9yZW1vdmUtcHJvZHVjdC1pbWFnZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBDYXRhbG9nQ29udHJvbGxlci5yZW1vdmVQcm9kdWN0SW1hZ2VcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9nZXQtY29sbGVjdGlvbnMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ2F0YWxvZ0NvbnRyb2xsZXIuZ2V0Q29sbGVjdGlvbnNcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vY3JlYXRlLWNvbGxlY3Rpb24nLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ2F0YWxvZ0NvbnRyb2xsZXIuY3JlYXRlQ29sbGVjdGlvblxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9lZGl0LWNvbGxlY3Rpb24nLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ2F0YWxvZ0NvbnRyb2xsZXIuZWRpdENvbGxlY3Rpb25cclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vZGVsLWNvbGxlY3Rpb24nLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ2F0YWxvZ0NvbnRyb2xsZXIuZGVsZXRlQ29sbGVjdGlvblxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zZW5kLWxpbmstY2F0YWxvZycsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBDYXRhbG9nQ29udHJvbGxlci5zZW5kTGlua0NhdGFsb2dcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vc2V0LXByb2R1Y3QtdmlzaWJpbGl0eScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBDYXRhbG9nQ29udHJvbGxlci5zZXRQcm9kdWN0VmlzaWJpbGl0eVxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zZXQtY2FydC1lbmFibGVkJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIENhdGFsb2dDb250cm9sbGVyLnVwZGF0ZUNhcnRFbmFibGVkXHJcbik7XHJcblxyXG4vLyBTdGF0dXNcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vc2VuZC10ZXh0LXN0b3JpZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBTdGF0dXNDb250cm9sbGVyLnNlbmRUZXh0U3RvcmllXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3NlbmQtaW1hZ2Utc3RvcmllJyxcclxuICB1cGxvYWQuc2luZ2xlKCdmaWxlJyksXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBTdGF0dXNDb250cm9sbGVyLnNlbmRJbWFnZVN0b3JpZVxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9zZW5kLXZpZGVvLXN0b3JpZScsXHJcbiAgdXBsb2FkLnNpbmdsZSgnZmlsZScpLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgU3RhdHVzQ29udHJvbGxlci5zZW5kVmlkZW9TdG9yaWVcclxuKTtcclxuXHJcbi8vIExhYmVsc1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9hZGQtbmV3LWxhYmVsJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIExhYmVsc0NvbnRyb2xsZXIuYWRkTmV3TGFiZWxcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vYWRkLW9yLXJlbW92ZS1sYWJlbCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBMYWJlbHNDb250cm9sbGVyLmFkZE9yUmVtb3ZlTGFiZWxzXHJcbik7XHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vZ2V0LWFsbC1sYWJlbHMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgTGFiZWxzQ29udHJvbGxlci5nZXRBbGxMYWJlbHNcclxuKTtcclxucm91dGVzLnB1dChcclxuICAnL2FwaS86c2Vzc2lvbi9kZWxldGUtYWxsLWxhYmVscycsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBMYWJlbHNDb250cm9sbGVyLmRlbGV0ZUFsbExhYmVsc1xyXG4pO1xyXG5yb3V0ZXMucHV0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2RlbGV0ZS1sYWJlbC86aWQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgTGFiZWxzQ29udHJvbGxlci5kZWxldGVMYWJlbFxyXG4pO1xyXG5cclxuLy8gQ29udGFjdFxyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2NoZWNrLW51bWJlci1zdGF0dXMvOnBob25lJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuY2hlY2tOdW1iZXJTdGF0dXNcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9hbGwtY29udGFjdHMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRBbGxDb250YWN0c1xyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2NvbnRhY3QvOnBob25lJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuZ2V0Q29udGFjdFxyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3Byb2ZpbGUvOnBob25lJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuZ2V0TnVtYmVyUHJvZmlsZVxyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3Byb2ZpbGUtcGljLzpwaG9uZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmdldFByb2ZpbGVQaWNGcm9tU2VydmVyXHJcbik7XHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vcHJvZmlsZS1zdGF0dXMvOnBob25lJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuZ2V0U3RhdHVzXHJcbik7XHJcblxyXG4vLyBCbG9ja2xpc3Rcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9ibG9ja2xpc3QnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRCbG9ja0xpc3RcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vYmxvY2stY29udGFjdCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmJsb2NrQ29udGFjdFxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi91bmJsb2NrLWNvbnRhY3QnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci51bmJsb2NrQ29udGFjdFxyXG4pO1xyXG5cclxuLy8gRGV2aWNlXHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vZ2V0LWJhdHRlcnktbGV2ZWwnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5nZXRCYXR0ZXJ5TGV2ZWxcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9ob3N0LWRldmljZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLmdldEhvc3REZXZpY2VcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi9nZXQtcGhvbmUtbnVtYmVyJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIERldmljZUNvbnRyb2xsZXIuZ2V0UGhvbmVOdW1iZXJcclxuKTtcclxuXHJcbi8vIFByb2ZpbGVcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vc2V0LXByb2ZpbGUtcGljJyxcclxuICB1cGxvYWQuc2luZ2xlKCdmaWxlJyksXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLnNldFByb2ZpbGVQaWNcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vcHJvZmlsZS1zdGF0dXMnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgRGV2aWNlQ29udHJvbGxlci5zZXRQcm9maWxlU3RhdHVzXHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2NoYW5nZS11c2VybmFtZScsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBEZXZpY2VDb250cm9sbGVyLnNldFByb2ZpbGVOYW1lXHJcbik7XHJcblxyXG4vLyBCdXNpbmVzc1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9lZGl0LWJ1c2luZXNzLXByb2ZpbGUnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgU2Vzc2lvbkNvbnRyb2xsZXIuZWRpdEJ1c2luZXNzUHJvZmlsZVxyXG4pO1xyXG5yb3V0ZXMuZ2V0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2dldC1idXNpbmVzcy1wcm9maWxlcy1wcm9kdWN0cycsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBPcmRlckNvbnRyb2xsZXIuZ2V0QnVzaW5lc3NQcm9maWxlc1Byb2R1Y3RzXHJcbik7XHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vZ2V0LW9yZGVyLWJ5LW1lc3NhZ2VJZCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBPcmRlckNvbnRyb2xsZXIuZ2V0T3JkZXJieU1zZ1xyXG4pO1xyXG5yb3V0ZXMuZ2V0KCcvYXBpLzpzZWNyZXRrZXkvYmFja3VwLXNlc3Npb25zJywgTWlzY0NvbnRyb2xsZXIuYmFja3VwQWxsU2Vzc2lvbnMpO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2VjcmV0a2V5L3Jlc3RvcmUtc2Vzc2lvbnMnLFxyXG4gIHVwbG9hZC5zaW5nbGUoJ2ZpbGUnKSxcclxuICBNaXNjQ29udHJvbGxlci5yZXN0b3JlQWxsU2Vzc2lvbnNcclxuKTtcclxucm91dGVzLmdldChcclxuICAnL2FwaS86c2Vzc2lvbi90YWtlLXNjcmVlbnNob3QnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIE1pc2NDb250cm9sbGVyLnRha2VTY3JlZW5zaG90XHJcbik7XHJcbnJvdXRlcy5wb3N0KCcvYXBpLzpzZXNzaW9uL3NldC1saW1pdCcsIE1pc2NDb250cm9sbGVyLnNldExpbWl0KTtcclxuXHJcbi8vQ29tbXVuaXR5c1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9jcmVhdGUtY29tbXVuaXR5JyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIENvbW11bml0eUNvbnRyb2xsZXIuY3JlYXRlQ29tbXVuaXR5XHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL2RlYWN0aXZhdGUtY29tbXVuaXR5JyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIENvbW11bml0eUNvbnRyb2xsZXIuZGVhY3RpdmF0ZUNvbW11bml0eVxyXG4pO1xyXG5yb3V0ZXMucG9zdChcclxuICAnL2FwaS86c2Vzc2lvbi9hZGQtY29tbXVuaXR5LXN1Ymdyb3VwJyxcclxuICB2ZXJpZnlUb2tlbixcclxuICBzdGF0dXNDb25uZWN0aW9uLFxyXG4gIENvbW11bml0eUNvbnRyb2xsZXIuYWRkU3ViZ3JvdXBzQ29tbXVuaXR5XHJcbik7XHJcbnJvdXRlcy5wb3N0KFxyXG4gICcvYXBpLzpzZXNzaW9uL3JlbW92ZS1jb21tdW5pdHktc3ViZ3JvdXAnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ29tbXVuaXR5Q29udHJvbGxlci5yZW1vdmVTdWJncm91cHNDb21tdW5pdHlcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vcHJvbW90ZS1jb21tdW5pdHktcGFydGljaXBhbnQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ29tbXVuaXR5Q29udHJvbGxlci5wcm9tb3RlQ29tbXVuaXR5UGFydGljaXBhbnRcclxuKTtcclxucm91dGVzLnBvc3QoXHJcbiAgJy9hcGkvOnNlc3Npb24vZGVtb3RlLWNvbW11bml0eS1wYXJ0aWNpcGFudCcsXHJcbiAgdmVyaWZ5VG9rZW4sXHJcbiAgc3RhdHVzQ29ubmVjdGlvbixcclxuICBDb21tdW5pdHlDb250cm9sbGVyLmRlbW90ZUNvbW11bml0eVBhcnRpY2lwYW50XHJcbik7XHJcbnJvdXRlcy5nZXQoXHJcbiAgJy9hcGkvOnNlc3Npb24vY29tbXVuaXR5LXBhcnRpY2lwYW50cy86aWQnLFxyXG4gIHZlcmlmeVRva2VuLFxyXG4gIHN0YXR1c0Nvbm5lY3Rpb24sXHJcbiAgQ29tbXVuaXR5Q29udHJvbGxlci5nZXRDb21tdW5pdHlQYXJ0aWNpcGFudHNcclxuKTtcclxuXHJcbnJvdXRlcy5wb3N0KCcvYXBpLzpzZXNzaW9uL2NoYXR3b290JywgRGV2aWNlQ29udHJvbGxlci5jaGF0V29vdCk7XHJcblxyXG4vLyBBcGkgRG9jXHJcbnJvdXRlcy51c2UoJy9hcGktZG9jcycsIHN3YWdnZXJVaS5zZXJ2ZSk7XHJcbnJvdXRlcy5nZXQoJy9hcGktZG9jcycsIHN3YWdnZXJVaS5zZXR1cChzd2FnZ2VyRG9jdW1lbnQpKTtcclxuXHJcbi8vazhzXHJcbnJvdXRlcy5nZXQoJy9oZWFsdGh6JywgSGVhbHRoQ2hlY2suaGVhbHRoeik7XHJcbnJvdXRlcy5nZXQoJy91bmhlYWx0aHknLCBIZWFsdGhDaGVjay51bmhlYWx0aHkpO1xyXG5cclxuLy9NZXRyaWNzIFByb21ldGhldXNcclxuXHJcbnJvdXRlcy5nZXQoJy9tZXRyaWNzJywgcHJvbWV0aGV1c1JlZ2lzdGVyLm1ldHJpY3MpO1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgcm91dGVzO1xyXG4iXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7OztBQWVBLElBQUFBLFFBQUEsR0FBQUMsT0FBQTtBQUNBLElBQUFDLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUYsT0FBQTtBQUNBLElBQUFHLGlCQUFBLEdBQUFELHNCQUFBLENBQUFGLE9BQUE7O0FBRUEsSUFBQUksT0FBQSxHQUFBRixzQkFBQSxDQUFBRixPQUFBO0FBQ0EsSUFBQUssaUJBQUEsR0FBQUMsdUJBQUEsQ0FBQU4sT0FBQTtBQUNBLElBQUFPLGFBQUEsR0FBQUQsdUJBQUEsQ0FBQU4sT0FBQTtBQUNBLElBQUFRLG1CQUFBLEdBQUFGLHVCQUFBLENBQUFO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