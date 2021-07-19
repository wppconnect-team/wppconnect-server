export default {
  caption: {
    path: '$item',
    formatting: (value) => {
      return value.caption || '';
    },
  },
  mimetype: 'mimetype',
  size: 'size',
  duration: 'duration',
  fileUrl: {
    path: '$item',
    formatting: (value) => {
      return value.fileUrl || '';
    },
  },
};
