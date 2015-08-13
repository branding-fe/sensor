/*******************************************************************************
*     File Name           :     gulpfile.js
*     Created By          :     DestinyXie
*     Creation Date       :     [2015-08-12 15:21]
*     Last Modified       :     [2015-08-13 19:15]
*     Description         :     gulpfile
********************************************************************************/


var gulp = require('gulp');
var uglify = require('gulp-uglify');
var concat = require('gulp-concat');
var ro = require('gulp-requirejs-optimize');

gulp.task('js-min', function () {
    gulp.src(['src/**/*.js', '!src/eraseYSLDMask.js'])
        .pipe(concat('all.js'))
        .pipe(uglify())
        .pipe(gulp.dest('gulp-build'));
});

gulp.task('ro', function () {
    gulp.src(['src/erasableMask.js', 'src/geolocation.js', 'src/orientation.js', 'src/shake.js', 'src/x.js'])
        .pipe(ro({
            paths: {
                'sensor': '.'
            }
        }))
        .pipe(gulp.dest('gulp-build'));
});

gulp.task('default', ['js-min', 'ro'], function() {
    console.log('default done!');
});
