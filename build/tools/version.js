var fs = require('fs'),
    path = require('path');

var versionNumberFile = '../../version';

function readVersionNumber() {
    return fs.readFileSync(path.join(__dirname, versionNumberFile));
}

module.exports = readVersionNumber();