/*******************************************************************************
*     File Name           :     gulpfile.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2015-08-12 15:21]
*     Last Modified       :     [2015-08-14 19:49]
*     Description         :     gulpfile
********************************************************************************/


var gulp = require('gulp');
var uglify = require('gulp-uglify');
var gutil = require('gulp-util');
var chalk = require('chalk');
var ro = require('gulp-requirejs-optimize');

gulp.task('js-min', function () {
    return gulp.src(['src/**/*.js', '!src/eraseYSLDMask.js', '!src/require.js'])
        .pipe(uglify())
        .pipe(gulp.dest('gulp-min'));
});

var apis = ['erasableMask', 'geolocation', 'orientation', 'shake'];
apis.forEach(function (api) {
    // combine to one file
    gulp.task(api, function () {
        var includes = [api];
        if ('geolocation' === api) {
            includes.push('x');
        }
        var requireConfig = {
            paths: {
                'sensor': '.'
            }
            ,name: 'almond'
            ,include: includes
            // ,optimize: 'none' // debug
            // ,wrap: true // add function wrapper
            // ,useSourseUrl: true // source maps, need `optimize: 'none'`
        };
        return gulp.src('src/' + api + '.js')
            .pipe(ro(requireConfig))
            .pipe(gulp.dest('gulp-build'));
    });
});

gulp.task('default', ['js-min']);
gulp.task('ro', apis);
