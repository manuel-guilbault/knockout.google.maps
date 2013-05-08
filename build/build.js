var fs = require('fs'),
    path = require('path');

var versionNumberFile = '../version',
    versionPlaceholder = '##VERSION##',
    versionHeaderFile = 'fragments/version-header.js',
    externPreFile = 'fragments/extern-pre.js',
    externPostFile = 'fragments/extern-post.js',
    amdPreFile = 'fragments/amd-pre.js',
    amdPostFile = 'fragments/amd-post.js',
    sourceReferencesFile = 'fragments/source-references.js',
    rootDirectory = '..',
    outputDebugFile = 'dist/knockout.google.maps-' + versionPlaceholder + '.debug.js',
    outputFile = 'dist/knockout.google.maps-' + versionPlaceholder + '.js';

function loadSourceReferences() {
    var sourceReferences = [];

    global.knockoutGoogleMapDebugCallback = function (references) {
        sourceReferences = references;
    }

    require(path.join(__dirname, sourceReferencesFile));

    delete global.knockoutGoogleMapDebugCallback;

    return sourceReferences.map(function (file) {
        return path.join(rootDirectory, file);
    });
}

function toAbsolute(file) {
    return path.join(__dirname, file);
}

function readVersionNumber() {
    return fs.readFileSync(toAbsolute(versionNumberFile));
}

function mergeSourceFiles(files) {
    var source = '';
    files.forEach(function (file) {
        if (source) {
            source += '\n';
        }
        source += fs.readFileSync(file);
    });
    return source;
}

function buildSource(sourceFiles, version) {
    var pre = [versionHeaderFile, externPreFile, amdPreFile];
    var post = [amdPostFile, externPostFile];

    var files = pre.concat(sourceFiles, post);
    var source = mergeSourceFiles(files.map(toAbsolute));
    source = source.replace(versionPlaceholder, version);
    return source;
}

function writeSource(file, source) {
    fs.writeFileSync(file, source);
}

var version = readVersionNumber();
var sourcesFiles = loadSourceReferences();

var source = buildSource(sourcesFiles, version);

writeSource(outputDebugFile.replace(versionPlaceholder, version), source);

//TODO minify source
writeSource(outputFile.replace(versionPlaceholder, version), source);