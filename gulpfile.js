const gulp = require('gulp');
const mocha = require('gulp-mocha');
const ts = require('gulp-typescript');
const tslint = require("gulp-tslint");
const tsProject = ts.createProject('tsconfig.json');
const compileInterfaces = require('./tests/compileInterfaces');

gulp.task('build', () => {
  return tsProject.src('src/index.ts')
    .pipe(tsProject())
    .js.pipe(gulp.dest('dist'));
});

gulp.task('compileTestSchemas', ['build'], () => {
  return compileInterfaces();
});

gulp.task('tslint', () => {
  gulp.src('src/**/*.ts')
    .pipe(tslint({
      formatter: "verbose"
    }))
    .pipe(tslint.report())
});

gulp.task('acceptanceTest', ['compileTestSchemas'], () => {
  return gulp.src('./tests/**/*.test.js', {
    read: false
  })
    .pipe(mocha({
      reporter: 'spec'
    }));
});

gulp.task('test', ['tslint', 'acceptanceTest']);
