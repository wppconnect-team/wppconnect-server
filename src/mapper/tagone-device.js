export default {
  number: 'wid.user',
  connected: 'connected',
  phone: {
    path: 'phone',
    nested: {
      wa_version: {
        path: 'wa_version',
      },
      mcc: {
        path: 'mcc',
      },
      mnc: {
        path: 'mnc',
      },
      os_version: {
        path: 'os_version',
      },
      device_manufacturer: {
        path: 'device_manufacturer',
      },
      device_model: {
        path: 'device_model',
      },
      os_build_number: {
        path: 'os_build_number',
      },
    },
  },
  platform: 'platform',
  locales: 'locales',
  battery: 'battery',
  plugged: 'plugged',
  pushname: 'pushname',
};
