module.exports = function (grunt) {
    grunt.loadNpmTasks('grunt-css');

    grunt.initConfig({
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
                src: ['lib/yajc.js'],
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