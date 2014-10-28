/*******************************************************************************
*     File Name           :     Gruntfile.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2014-10-28 18:08]
*     Last Modified       :     [2014-10-28 18:11]
*     Description         :     Gruntfile
********************************************************************************/

module.exports = function(grunt) {
  //配置参数
  grunt.initConfig({
     concat: {
         options: {
             separator: ';',
             stripBanners: true
         },
         dist: {
             src: [
                 "src/**/*.js"
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
     }
  });

  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.registerTask('default', ['concat', 'uglify']);
}
