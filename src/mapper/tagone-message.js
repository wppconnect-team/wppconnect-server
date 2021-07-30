export default {
  event: 'event',
  session: 'session',
  id: 'id',
  content: {
    path: '$item',
    formatting: (value) => {
      return value.mimetype ? value.caption || '' : value.body;
    },
  },
  type: 'type',
  timestamp: 't',
  phone: {
    path: 'from',
    formatting: (value) => {
      return value.split('@')[0];
    },
  },
  status: 'ack',
  isGroupMsg: 'isGroupMsg',
  contactName: {
    path: 'sender',
    formatting: (value) => {
      return value.isMyContact ? value.formattedName : value.pushname;
    },
  },
  imgContactUrl: 'sender.profilePicThumbObj.eurl',
};
