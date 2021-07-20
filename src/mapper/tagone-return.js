export default {
  id: {
    path: '$item',
    formatting: (value) => {
      return value.type === 'chat' ? value.id : value.to._serialized;
    },
  },
  ack: {
    path: '$item',
    formatting: (value) => {
      return value.type === 'chat' ? value.ack : 0;
    },
  },
  phone: {
    path: '$item',
    formatting: (value) => {
      return value.type === 'chat' ? value.to.split('@')[0] : value.to.remote.user;
    },
  },
};
