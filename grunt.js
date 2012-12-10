module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-css');

    grunt.initConfig({
        pkg: '<json:package.json>',
        meta: {
            banner: '/*! <%= pkg.title || pkg.name %> <%= pkg.version %>, <%= grunt.template.today("yyyy-mm-dd") %>\n' +
                    '<%= pkg.homepage ? " *  " + pkg.homepage + "\n" : "" %>' +
                    ' *  Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>\n' +
                    ' *  Licensed under the <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        jshint: {
            options: {
                browser: true
            }
        },
        lint: {
            all: ['lib/yajc.js']
        },
        min: {
            all: {
                src: ['<banner>', 'lib/yajc.js'],
                dest: 'lib/yajc.min.js'
            }
        },
        cssmin: {
            all: {
                src: ['lib/yajc.css'],
                dest: 'lib/yajc.min.css'
            }
        }
    });

    grunt.registerTask('default', 'lint min cssmin');
};