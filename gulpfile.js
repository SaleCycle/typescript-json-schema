const gulp = require('gulp');
const ts = require('gulp-typescript');
const tslint = require("gulp-tslint");
const tsProject = ts.createProject('tsconfig.json');

gulp.task('build', function () {
    return tsProject.src("src/index.ts")
        .pipe(tsProject())
        .js.pipe(gulp.dest('dist'));
});

gulp.task('tslint', () => {
  gulp.src('src/**/*.ts')
    .pipe(tslint({
      formatter: "verbose"
    }))
    .pipe(tslint.report())
});

gulp.task('test', ['tslint']);
