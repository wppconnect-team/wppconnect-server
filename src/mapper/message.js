export default {
    event: 'event',
    session: 'session',
    id: 'id',
    isGroupMsg: 'isGroupMsg',
    message: {
        path: '$item',
        formatting: (value) => {
            return value.mimetype ? value.caption || '' : value.body;
        },
    },
    filecontent: {
        path: '$item',
        formatting: (value) => {
            return value.mimetype ? value.body : '';
        },
    },
    type: 'type',
    phone: {
        path: 'sender.id',
        formatting: (value) => {
            return typeof value == 'object' ? value.user : value.split('@')[0];
        },
    },
    author: {
        path: 'sender',
        formatting: (value) => {
            return value.isMyContact ? value.formattedName : value.pushname;
        },
    },
    timestamp: 't',
    mimetype: {
        path: '$item',
        formatting: (value) => {
            return value.mimetype || '';
        },
    },
    filename: {
        path: '$item',
        formatting: (value) => {
            return value.mimetype ? value.filename || value.id : '';
        },
    },
};
