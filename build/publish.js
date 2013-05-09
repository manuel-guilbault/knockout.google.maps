var fs = require('fs'),
    path = require('path'),
    sys = require('sys'),
    process = require('child_process'),
    util = require('util');

var nugetSpecTemplateFile = 'knockout.google.maps.TEMPLATE.nuspec',
    nugetSpecFile = 'knockout.google.maps.nuspec',
    nugetVersionMatcher = new RegExp('\\$version\\$', 'g'),
    nugetOutputDirectory = 'dist',
    nugetPackageTemplate = '../dist/knockout.google.maps.$version$.nupkg',
    nugetApiKey = '???';

function buildNugetSpec(version) {
    var nugetSpecTemplate = fs.readFileSync(path.join(__dirname, nugetSpecTemplateFile));
    var nugetSpec = nugetSpecTemplate.toString().replace(nugetVersionMatcher, version);
    fs.writeFileSync(path.join(__dirname, nugetSpecFile), nugetSpec);
}

function runCommand(command) {
    return process.exec(command, function puts(error, stdout, stderr) {
        sys.puts(stdout);
        if (error) {
            console.log('ERROR: ' + error);
        }
    });
}

function createNuGetPackage(exitHandler) {
    runCommand(util.format(
        'nuget pack %s -OutputDirectory %s',
        path.join(__dirname, nugetSpecFile),
        nugetOutputDirectory
    )).on('exit', exitHandler);
}

function publishNuGetPackage(version) {
    var nugetPackage = nugetPackageTemplate.replace(nugetVersionMatcher, version);
    runCommand(util.format(
        'nuget push %s %s',
        path.join(__dirname, nugetPackage),
        nugetApiKey
    ));
}

var version = require('./tools/version');

buildNugetSpec(version);
createNuGetPackage(function () {
    publishNuGetPackage(version);
});