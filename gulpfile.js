var del = require('del');
var espower = require('gulp-espower');
var mocha = require('gulp-mocha');
var gulp = require('gulp');
var seq = require('run-sequence');
var shell = require('gulp-shell');

var opt = {
  dist:          './dist',
  lib:           './lib',
  test:          './test',
  testEs5:       './test-es5',
  testEspowered: './test-espowered'
};

/* clean */
gulp.task('clean:dist', del.bind(null, [
  opt.dist
]));
gulp.task('clean', del.bind(null, [
  opt.lib + '/**/*.js',
  opt.lib + '/**/*.js.map',
  opt.testEs5,
  opt.testEspowered
]));

/* ts */
var tsc = 'tsc -m commonjs -t es6 --noImplicitAny';
gulp.task('ts:lib_', shell.task([`find ${opt.lib} -name *.ts | xargs ${tsc}`]));
gulp.task('ts:lib',  function(done) {seq('clean', 'ts:lib_', done)});
gulp.task('ts',      function(done) {seq('clean', ['ts:lib_', 'ts:example_'], done)});

/* babel */
gulp.task('babel:lib',  shell.task([`babel ${opt.lib}  --out-dir ${opt.lib}`]));
gulp.task('babel:test', shell.task([`babel ${opt.test} --out-dir ${opt.testEs5}`]));
gulp.task('babel', ['babel:lib']);

/* watch */
gulp.task('watch', ['test'], function() {
  gulp.watch([`${opt.lib}/**/*.ts`], ['test']);
});

/* build */
gulp.task('copy:lib', function() {
  gulp.src(`${opt.lib}/**/*.js`)
    .pipe(gulp.dest(opt.dist));
});
gulp.task('build:lib', function(done) {seq(['clean:dist', 'ts:lib'], 'babel:lib', 'copy:lib', done)});
gulp.task('build',     function(done) {seq('build:lib', done)});

/* test */
gulp.task('espower', function() {
  return gulp.src(`${opt.testEs5}/**/*.js`)
    .pipe(espower())
    .pipe(gulp.dest(opt.testEspowered));
});
gulp.task('mocha', function() {
  return gulp.src(`${opt.testEspowered}/**/*.js`)
    .pipe(mocha({reporter: 'spec'}))
    .pipe(gulp.dest(opt.testEspowered));
});
gulp.task('test', function(done) {seq('ts:lib_', ['babel:lib', 'babel:test'], 'espower', 'mocha', done)});