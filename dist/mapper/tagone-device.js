"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _default = exports.default = {
  number: 'wid.user',
  connected: 'connected',
  phone: {
    path: 'phone',
    nested: {
      wa_version: {
        path: 'wa_version'
      },
      mcc: {
        path: 'mcc'
      },
      mnc: {
        path: 'mnc'
      },
      os_version: {
        path: 'os_version'
      },
      device_manufacturer: {
        path: 'device_manufacturer'
      },
      device_model: {
        path: 'device_model'
      },
      os_build_number: {
        path: 'os_build_number'
      }
    }
  },
  platform: 'platform',
  locales: 'locales',
  battery: 'battery',
  plugged: 'plugged',
  pushname: 'pushname'
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJudW1iZXIiLCJjb25uZWN0ZWQiLCJwaG9uZSIsInBhdGgiLCJuZXN0ZWQiLCJ3YV92ZXJzaW9uIiwibWNjIiwibW5jIiwib3NfdmVyc2lvbiIsImRldmljZV9tYW51ZmFjdHVyZXIiLCJkZXZpY2VfbW9kZWwiLCJvc19idWlsZF9udW1iZXIiLCJwbGF0Zm9ybSIsImxvY2FsZXMiLCJiYXR0ZXJ5IiwicGx1Z2dlZCIsInB1c2huYW1lIl0sInNvdXJjZXMiOlsiLi4vLi4vc3JjL21hcHBlci90YWdvbmUtZGV2aWNlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IHtcclxuICBudW1iZXI6ICd3aWQudXNlcicsXHJcbiAgY29ubmVjdGVkOiAnY29ubmVjdGVkJyxcclxuICBwaG9uZToge1xyXG4gICAgcGF0aDogJ3Bob25lJyxcclxuICAgIG5lc3RlZDoge1xyXG4gICAgICB3YV92ZXJzaW9uOiB7XHJcbiAgICAgICAgcGF0aDogJ3dhX3ZlcnNpb24nLFxyXG4gICAgICB9LFxyXG4gICAgICBtY2M6IHtcclxuICAgICAgICBwYXRoOiAnbWNjJyxcclxuICAgICAgfSxcclxuICAgICAgbW5jOiB7XHJcbiAgICAgICAgcGF0aDogJ21uYycsXHJcbiAgICAgIH0sXHJcbiAgICAgIG9zX3ZlcnNpb246IHtcclxuICAgICAgICBwYXRoOiAnb3NfdmVyc2lvbicsXHJcbiAgICAgIH0sXHJcbiAgICAgIGRldmljZV9tYW51ZmFjdHVyZXI6IHtcclxuICAgICAgICBwYXRoOiAnZGV2aWNlX21hbnVmYWN0dXJlcicsXHJcbiAgICAgIH0sXHJcbiAgICAgIGRldmljZV9tb2RlbDoge1xyXG4gICAgICAgIHBhdGg6ICdkZXZpY2VfbW9kZWwnLFxyXG4gICAgICB9LFxyXG4gICAgICBvc19idWlsZF9udW1iZXI6IHtcclxuICAgICAgICBwYXRoOiAnb3NfYnVpbGRfbnVtYmVyJyxcclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgfSxcclxuICBwbGF0Zm9ybTogJ3BsYXRmb3JtJyxcclxuICBsb2NhbGVzOiAnbG9jYWxlcycsXHJcbiAgYmF0dGVyeTogJ2JhdHRlcnknLFxyXG4gIHBsdWdnZWQ6ICdwbHVnZ2VkJyxcclxuICBwdXNobmFtZTogJ3B1c2huYW1lJyxcclxufTtcclxuIl0sIm1hcHBpbmdzIjoicUlBQWU7RUFDYkEsTUFBTSxFQUFFLFVBQVU7RUFDbEJDLFNBQVMsRUFBRSxXQUFXO0VBQ3RCQyxLQUFLLEVBQUU7SUFDTEMsSUFBSSxFQUFFLE9BQU87SUFDYkMsTUFBTSxFQUFFO01BQ05DLFVBQVUsRUFBRTtRQUNWRixJQUFJLEVBQUU7TUFDUixDQUFDO01BQ0RHLEdBQUcsRUFBRTtRQUNISCxJQUFJLEVBQUU7TUFDUixDQUFDO01BQ0RJLEdBQUcsRUFBRTtRQUNISixJQUFJLEVBQUU7TUFDUixDQUFDO01BQ0RLLFVBQVUsRUFBRTtRQUNWTCxJQUFJLEVBQUU7TUFDUixDQUFDO01BQ0RNLG1CQUFtQixFQUFFO1FBQ25CTixJQUFJLEVBQUU7TUFDUixDQUFDO01BQ0RPLFlBQVksRUFBRTtRQUNaUCxJQUFJLEVBQUU7TUFDUixDQUFDO01BQ0RRLGVBQWUsRUFBRTtRQUNmUixJQUFJLEVBQUU7TUFDUjtJQUNGO0VBQ0YsQ0FBQztFQUNEUyxRQUFRLEVBQUUsVUFBVTtFQUNwQkMsT0FBTyxFQUFFLFNBQVM7RUFDbEJDLE9BQU8sRUFBRSxTQUFTO0VBQ2xCQyxPQUFPLEVBQUUsU0FBUztFQUNsQkMsUUFBUSxFQUFFO0FBQ1osQ0FBQyIsImlnbm9yZUxpc3QiOltdfQ==