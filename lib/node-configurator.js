var path = require('path'),
    fs = require('fs'),

    levels = require('enb-bem-techs/techs/levels'),
    files = require('enb-bem-techs/techs/files'),

    provide = require('enb/techs/file-provider'),
    depsByTechToBemdecl = require('enb-bem-techs/techs/deps-by-tech-to-bemdecl'),
    deps = require('enb-bem-techs/techs/deps-old'),
    mergeBemdecl = require('enb-bem-techs/techs/merge-bemdecl'),

    i18nMergeKeysets = require('enb-bem-i18n/techs/i18n-merge-keysets'),
    i18nLangJs = require('enb-bem-i18n/techs/i18n-lang-js'),
    mergeFile = require('enb/techs/file-merge'),

    references = require('./techs/references'),
    spec = require('./techs/tmpl-spec');

exports.configure = function (config, options) {
    var pattern = path.join(options.destPath, '*'),
        sourceLevels = [].concat(options.sourceLevels);

    config.nodes(pattern, function (nodeConfig) {
        var nodePath = nodeConfig.getNodePath(),
            sublevel = path.join(nodePath, 'blocks'),
            langs = options.langs,
            engines = options.engines;

        if (fs.existsSync(sublevel)) {
            sourceLevels.push(sublevel);
        }

        // Base techs
        nodeConfig.addTechs([
            [levels, { levels: sourceLevels }],
            [provide, { target: '?.base.bemdecl.js' }],
            [depsByTechToBemdecl, {
                target: '?.tech.bemdecl.js',
                filesTarget: '?.base.files',
                sourceTech: 'tmpl-spec.js'
            }],
            [mergeBemdecl, { sources: ['?.base.bemdecl.js', '?.tech.bemdecl.js'] }],
            [deps],
            [files, {
                depsFile: '?.base.bemdecl.js',
                filesTarget: '?.base.files',
                dirsTarget: '?.base.dirs'
            }],
            [files]
        ]);

        engines.forEach(function (engine) {
            nodeConfig.addTech([engine.tech, engine.options]);
            nodeConfig.addTarget(engine.target);
        });

        if (langs.length) {
            nodeConfig.addTechs([
                [i18nMergeKeysets, { lang: 'all' }],
                [i18nLangJs, { lang: 'all' }]
            ]);

            langs.forEach(function (lang) {
                nodeConfig.addTechs([
                    [i18nMergeKeysets, { lang: lang }],
                    [i18nLangJs, { lang: lang }]
                ]);

                engines.forEach(function (engine) {
                    var target = engine.target.replace('.js', '.' + lang + '.js'),
                        langTarget = '?.lang.' + lang + '.js';

                    nodeConfig.addTech([mergeFile, {
                        sources: ['?.lang.all.js', langTarget, engine.target],
                        target: target
                    }]);
                    nodeConfig.addTarget(target);
                });
            });
        }

        nodeConfig.addTechs([
            [references, { dirsTarget: '?.base.dirs' }],
            [spec, { engines: engines, langs: langs, saveHtml: options.saveHtml }]
        ]);

        nodeConfig.addTarget('?.tmpl-spec.js');
    });
};
