'use strict';
var vow = require('vow'),
    vowFs = require('vow-fs'),
    _ = require('lodash'),
    istanbul = require('istanbul'),
    SourceLocator = require('enb-source-map/lib/source-locator'),

    CoverageObject = require('./coverage-object');

function unmapCoverageObject(sourceObject) {
    return vow.all(Object.keys(sourceObject).map(function (fileName) {
            return vowFs.read(fileName, 'utf8').then(function (source) {
                return unmapFile(fileName, sourceObject[fileName], source);
            });
        }))
        .then(function (coverageObjects) {
            return coverageObjects.reduce(istanbul.utils.mergeFileCoverage);
        })
        .then(function (totalCoverage) {
            var withNoSources = _.omit(totalCoverage, function (value, fileName) {
                return fileName in sourceObject;
            });
            if (_.isEmpty(withNoSources)) {
                // if no sources left after removal of originals,
                // source map is absent
                return totalCoverage;
            }
            return withNoSources;
        });
}

function unmapFile(fileName, fileObject, source) {
    var locator = new SourceLocator(fileName, source),
        result = new CoverageObject();

    Object.keys(fileObject.statementMap).forEach(function (key) {
        var statement = fileObject.statementMap[key],
            originalStart = locator.locate(statement.start.line, statement.start.column),
            originalEnd = locator.locate(statement.end.line, statement.end.column);
        result.addStatement(originalStart, originalEnd, fileObject.s[key]);
    });

    Object.keys(fileObject.fnMap).forEach(function (key) {
        var fn = fileObject.fnMap[key],
            loc = fn.loc,
            originalStart = locator.locate(loc.start.line, loc.start.column),
            originalEnd = locator.locate(loc.end.line, loc.end.column);
        result.addFunction(fn.name, originalStart, originalEnd, fileObject.f[key]);
    });

    Object.keys(fileObject.branchMap).forEach(function (key) {
        var branch = fileObject.branchMap[key],
            locations = branch.locations.map(function (loc) {
                return {
                    start: locator.locate(loc.start.line, loc.start.column),
                    end: locator.locate(loc.end.line, loc.end.column)
                };
            });
        result.addBranch(
            branch.type,
            locations,
            fileObject.b[key]
        );
    });

    return result.coverage;
}

module.exports = unmapCoverageObject;
