export default {
  event: 'event',
  session: 'session',
  id: 'id',
  content: {
    path: '$item',
    formatting: (value: any) => {
      return value.mimetype ? value.caption || '' : value.body;
    },
  },
  type: 'type',
  timestamp: 't',
  phone: {
    path: 'from',
    formatting: (value: any) => {
      return value.split('@')[0];
    },
  },
  status: 'ack',
  isGroupMsg: 'isGroupMsg',
  contactName: {
    path: 'sender',
    formatting: (value: any) => {
      return value.isMyContact ? value.formattedName : value.pushname;
    },
  },
  imgContactUrl: 'sender.profilePicThumbObj.eurl',
};
