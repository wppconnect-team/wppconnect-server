export default {
  caption: {
    path: '$item',
    formatting: (value) => {
      return value.caption || '';
    },
  },
  mimetype: 'mimetype',
  size: 'size',
  fileUrl: {
    path: '$item',
    formatting: (value) => {
      return value.fileUrl || '';
    },
  },
};
