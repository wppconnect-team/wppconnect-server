if (process.env.CONFIG_JSON != undefined) {
  console.log('Update config.json from environment variable');
  var fs = require('fs');
  var filePath = './dist/config.json';

  fs.writeFile(filePath, process.env.CONFIG_JSON, function (err) {
    if (err) return console.log(err);
  });
}