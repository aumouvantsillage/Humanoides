module.exports = function(grunt) {
    "use strict";

    require("load-grunt-tasks")(grunt);

    var pkg = grunt.file.readJSON("package.json");
    pkg.version = grunt.template.today("yy.mm.ddHHMM");

    grunt.verbose.write("Checking for bower_components...");
    if (grunt.file.isDir("bower_components")) {
        grunt.verbose.ok();
    }
    else {
        grunt.log.error("bower_components not found! Please run `bower install`.");
        process.exit();
    }

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
