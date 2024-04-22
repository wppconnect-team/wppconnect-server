"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _default = exports.default = {
  id: 'id',
  type: 'kind',
  phone: {
    path: 'id.user',
    formatting: (value) => {
      return value.split('@')[0];
    }
  },
  author: {
    path: 'contact',
    formatting: (value) => {
      return value.isMyContact ? value.formattedName : value.pushname;
    }
  },
  timestamp: 't'
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJpZCIsInR5cGUiLCJwaG9uZSIsInBhdGgiLCJmb3JtYXR0aW5nIiwidmFsdWUiLCJzcGxpdCIsImF1dGhvciIsImlzTXlDb250YWN0IiwiZm9ybWF0dGVkTmFtZSIsInB1c2huYW1lIiwidGltZXN0YW1wIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hcHBlci90YWdvbmUtY2hhdC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgZGVmYXVsdCB7XHJcbiAgaWQ6ICdpZCcsXHJcbiAgdHlwZTogJ2tpbmQnLFxyXG4gIHBob25lOiB7XHJcbiAgICBwYXRoOiAnaWQudXNlcicsXHJcbiAgICBmb3JtYXR0aW5nOiAodmFsdWU6IGFueSkgPT4ge1xyXG4gICAgICByZXR1cm4gdmFsdWUuc3BsaXQoJ0AnKVswXTtcclxuICAgIH0sXHJcbiAgfSxcclxuICBhdXRob3I6IHtcclxuICAgIHBhdGg6ICdjb250YWN0JyxcclxuICAgIGZvcm1hdHRpbmc6ICh2YWx1ZTogYW55KSA9PiB7XHJcbiAgICAgIHJldHVybiB2YWx1ZS5pc015Q29udGFjdCA/IHZhbHVlLmZvcm1hdHRlZE5hbWUgOiB2YWx1ZS5wdXNobmFtZTtcclxuICAgIH0sXHJcbiAgfSxcclxuICB0aW1lc3RhbXA6ICd0JyxcclxufTtcclxuIl0sIm1hcHBpbmdzIjoicUlBQWU7RUFDYkEsRUFBRSxFQUFFLElBQUk7RUFDUkMsSUFBSSxFQUFFLE1BQU07RUFDWkMsS0FBSyxFQUFFO0lBQ0xDLElBQUksRUFBRSxTQUFTO0lBQ2ZDLFVBQVUsRUFBRUEsQ0FBQ0MsS0FBVSxLQUFLO01BQzFCLE9BQU9BLEtBQUssQ0FBQ0MsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUM1QjtFQUNGLENBQUM7RUFDREMsTUFBTSxFQUFFO0lBQ05KLElBQUksRUFBRSxTQUFTO0lBQ2ZDLFVBQVUsRUFBRUEsQ0FBQ0MsS0FBVSxLQUFLO01BQzFCLE9BQU9BLEtBQUssQ0FBQ0csV0FBVyxHQUFHSCxLQUFLLENBQUNJLGFBQWEsR0FBR0osS0FBSyxDQUFDSyxRQUFRO0lBQ2pFO0VBQ0YsQ0FBQztFQUNEQyxTQUFTLEVBQUU7QUFDYixDQUFDIiwiaWdub3JlTGlzdCI6W119