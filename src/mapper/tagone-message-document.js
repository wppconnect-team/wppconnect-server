export default {
  caption: {
    path: '$item',
    formatting: (value) => {
      return value.caption || '';
    },
  },
  mimetype: 'mimetype',
  size: 'size',
  filename: 'filename',
  pageCount: 'pageCount',
  fileUrl: {
    path: '$item',
    formatting: (value) => {
      return value.fileUrl || '';
    },
  },
};
