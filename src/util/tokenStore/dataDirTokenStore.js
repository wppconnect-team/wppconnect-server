import fs from 'fs';

var dataDirTokenStore = function (client) {
  this.tokenStore = {
    getToken: async (sessionName) => {
      return readToken(__dirname + '/../../../userData/' + sessionName + '/tokenData.json');
    },
    setToken: async (sessionName) => {
      if (client) {
        let token = {
          sessionName: sessionName,
          webhook: client.config?.webhook || false,
          config: JSON.stringify(client.config),
        };
        return saveToken(__dirname + '/../../../userData/' + sessionName + '/tokenData.json', token);
      }
    },
    removeToken: async (sessionName) => {
      fs.unlink(__dirname + '/../../../userData/' + sessionName + '/tokenData.json', function (err) {
        if (err) {
          return false;
        }
      });
      return true;
    },
    listTokens: async () => {
      return getDirectories(__dirname + '/../../../userData/');
    },
  };
};
function getDirectories(path) {
  try {
    return fs.readdirSync(path).filter(function (file) {
      return fs.statSync(path + '/' + file).isDirectory();
    });
  } catch (e) {
    return [];
  }
}
function saveToken(path, tokenData) {
  fs.writeFile(path, JSON.stringify(tokenData, null, 4), (err) => {
    if (err) {
      return false;
    }
  });
  return true;
}
function readToken(path) {
  fs.readFile(path, (err, data) => {
    if (err) {
      return false;
    }
    let tokenData = JSON.parse(data);
    return tokenData;
  });
}
module.exports = dataDirTokenStore;
