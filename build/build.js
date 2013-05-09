var fs = require('fs'),
    path = require('path');

var versionPlaceholder = '##VERSION##',
    versionHeaderFile = 'fragments/version-header.js',
    externPreFile = 'fragments/extern-pre.js',
    externPostFile = 'fragments/extern-post.js',
    amdPreFile = 'fragments/amd-pre.js',
    amdPostFile = 'fragments/amd-post.js',
    sourceReferencesFile = 'fragments/source-references.js',
    sourceRelativeToDirectory = '..',
    outputDebugFile = '../dist/knockout.google.maps-##VERSION##.debug.js',
    outputFile = '../dist/knockout.google.maps-##VERSION##.js';

function loadSourceReferences() {
    var sourceReferences = [];

    global.knockoutGoogleMapDebugCallback = function (references) {
        sourceReferences = references;
    }

    require(path.join(__dirname, sourceReferencesFile));

    delete global.knockoutGoogleMapDebugCallback;

    return sourceReferences.map(function (file) {
        return path.join(sourceRelativeToDirectory, file);
    });
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

    var files = pre.concat(sourceFiles, post).map(function (file) {
        return path.join(__dirname, file);
    });
    var source = mergeSourceFiles(files);
    source = source.replace(versionPlaceholder, version);
    return source;
}

function getOutputFile(template, version) {
    return path.join(__dirname, template.replace(versionPlaceholder, version));
}

var version = require('./tools/version');

var sourcesFiles = loadSourceReferences();

var source = buildSource(sourcesFiles, version);

fs.writeFileSync(getOutputFile(outputDebugFile, version), source);

//TODO minify source
fs.writeFileSync(getOutputFile(outputFile, version), source);