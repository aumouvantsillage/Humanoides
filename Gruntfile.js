module.exports = function(grunt) {
    "use strict";

    require("load-grunt-tasks")(grunt);

    var pkg = grunt.file.readJSON("package.json");
    pkg.version = grunt.template.today("yy.mm.ddHHMM");

    grunt.initConfig({
        pkg: pkg,

        /*
         * Transpile JavaScript source files from ES6 to ES5
         */
        babel: {
            options: {
                presets: ["es2015"]
            },
            all: {
                files: [{
                    expand: true,
                    src: ["js/**/*.js"],
                    dest: "build/"
                }]
            }
        },

        browserify: {
            all: {
                options: {
                    browserifyOptions: {
                        basedir: "build/js"
                    }
                },
                src: ["build/js/index.js"],
                dest: "build/js/index.web.js"
            }
        },

    });

    grunt.registerTask("default", ["babel", "browserify"]);
};
