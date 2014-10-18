var path = require('path');
var rootPath = path.join(__dirname, '..', '..', '..');

module.exports = function (config) {
    config.includeConfig(rootPath);

    var tmplSpecs = config.module('enb-bem-tmpl-specs').createConfigurator('tmpl-specs');

    tmplSpecs.configure({
        destPath: 'tmpl-specs',
        levels: ['blocks'],
        langs: ['en'],
        sourceLevels: [
            { path: '../libs/bem-core/common.blocks', check: false },
            { path: 'blocks', check: true }
        ],
        engines: {
            'BH': {
                tech: 'enb-bh/techs/bh-server',
                options: {
                    jsAttrName: 'data-bem',
                    jsAttrScheme: 'json'
                }
            },
            'BEMHTML dev': {
                tech: 'enb-bemxjst/techs/bemhtml-old',
                options: { devMode: true }
            },
            'BEMHTML prod': {
                tech: 'enb-bemxjst/techs/bemhtml-old',
                options: { devMode: false }
            }
        }
    });
};
