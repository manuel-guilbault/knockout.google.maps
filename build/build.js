var fs = require('fs'),
    path = require('path'),
    http = require('http'),
    querystring = require('querystring');

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

function minify(source, callback) {
    var postData = querystring.stringify({
        js_code: source,
        compilation_level: 'ADVANCED_OPTIMIZATIONS',
        output_info: 'compiled_code',
        output_format: 'text'
    });
    var options = {
        host: 'closure-compiler.appspot.com',
        port: '80',
        path: '/compile',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': postData.length
        }
    };
    var request = http.request(options, function (response) {
        var result = '';
        response.setEncoding('utf8');
        response.on('data', function (chunk) {
            console.log('Received chunk: ' + chunk);
            result += chunk;
        });
        response.on('end', function () {
            console.log('Response received.');
            callback(result);
        });
    });
    request.on('error', function (error) {
        console.log(error);
    });
    request.write(postData);
    request.end();
}

var version = require('./tools/version');

var sourcesFiles = loadSourceReferences();

var source = buildSource(sourcesFiles, version);

fs.writeFileSync(getOutputFile(outputDebugFile, version), source);

//minify(source, function (source) {
//    fs.writeFileSync(getOutputFile(outputFile, version), source);
//});