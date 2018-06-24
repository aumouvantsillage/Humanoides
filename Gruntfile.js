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
                presets: ["env"]
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
            options: {
                browserifyOptions: {
                    basedir: "build/js"
                }
            },
            index: {
                src: ["build/js/index.js"],
                dest: "build/js/index.web.js"
            },
            edit: {
                src: ["build/js/edit.js"],
                dest: "build/js/edit.web.js"
            }
        },

    });

    grunt.registerTask("default", ["babel", "browserify"]);
};
