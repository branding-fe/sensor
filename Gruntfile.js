/*******************************************************************************
*     File Name           :     Gruntfile.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-28 18:08]
*     Last Modified       :     [2015-01-19 19:20]
*     Description         :     Gruntfile
********************************************************************************/

module.exports = function(grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);


    //配置参数
    grunt.initConfig({
        concat: {
            options: {
                separator: ';',
                stripBanners: true
            },
            dist: {
                src: [
                    "src/util.js",
                    "src/x.js",
                    "src/rasableMask.js",
                    "src/geolocation.js",
                    "src/orientation.js",
                    "src/shake.js"
                ],
                dest: "build/index.js"
            }
        },
        uglify: {
            options: {
            },
            dist: {
                files: {
                'build/index-min.js': 'build/index.js'
                }
            }
        },
        requirejs: {
            compileJS: {
                options: {
                    baseUrl: 'src',
                    out: './dist/src/main.built.js',
                    name: 'main',
                    optimize: "uglify2",
                    generateSourceMaps: true,
                    preserveLicenseComments: false,
                    uglify: {
                        beautify: false,
                        ascii_only: true
                    }
                }
            },
            compile: {
                options: {
                    //common options for all build files
                },
                files: [
                    {
                        expand: true,
                        cwd: 'src',
                        src: ['*.build.json'],
                        dest: 'build'
                    }
                ]
            }
        }
    });

    grunt.registerTask('default', ['concat', 'uglify']);
    grunt.registerTask('r', ['requirejs:compileJS']);
    grunt.registerTask('re', ['requirejs:compile']);

};
