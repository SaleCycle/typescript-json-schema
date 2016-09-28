const gulp = require('gulp');
const ts = require('gulp-typescript');
const tsProject = ts.createProject('tsconfig.json');

gulp.task('build', function () {
    return tsProject.src("src/index.ts")
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist'));
});