var del = require('del');
var espower = require('gulp-espower');
var mocha = require('gulp-mocha');
var gulp = require('gulp');
var seq = require('run-sequence');
var shell = require('gulp-shell');

var opt = {
  lib:           './lib',
  src:           './src',
  test:          './test',
  testEs5:       './test-es5',
  testEspowered: './test-espowered'
};

/* clean */
gulp.task('clean:lib', del.bind(null, [
  opt.lib
]));
gulp.task('clean', del.bind(null, [
  opt.src + '/**/*.js',
  opt.src + '/**/*.js.map',
  opt.testEs5,
  opt.testEspowered
]));

/* ts */
var tsc = 'tsc -t es6 --noEmitOnError --noImplicitAny';
gulp.task('ts:src_', shell.task([`find ${opt.src} -name *.ts | xargs ${tsc}`]));
gulp.task('ts:src',  function(done) {seq('clean', 'ts:src_', done)});
gulp.task('ts',      function(done) {seq('clean', ['ts:src_', 'ts:example_'], done)});

/* babel */
gulp.task('babel:src',  shell.task([`babel ${opt.src}  --out-dir ${opt.src}`]));
gulp.task('babel:test', shell.task([`babel ${opt.test} --out-dir ${opt.testEs5}`]));
gulp.task('babel', ['babel:src']);

/* watch */
gulp.task('exec-watch', ['test'], function() {
  gulp.watch([`${opt.src}/**/*.ts`, `${opt.test}/**/*.es6`], ['test'])
    .on('error', function(err) {
      process.exit(1);
    });
});

gulp.task('watch', function() {
  var spawn = function() {
    var proc = require('child_process').spawn('gulp', ['exec-watch'], {stdio: 'inherit'});
    proc.on('close', function(c) {
      spawn();
    });
  };
  spawn();
});

/* build */
gulp.task('copy:src', function() {
  gulp.src(`${opt.src}/**/*.js`)
    .pipe(gulp.dest(opt.lib));
});
gulp.task('build:src', function(done) {seq(['clean:lib', 'ts:src'], 'babel:src', 'copy:src', done)});
gulp.task('build',     function(done) {seq('build:src', done)});

/* test */
gulp.task('espower', function() {
  return gulp.src(`${opt.testEs5}/**/*.js`)
    .pipe(espower())
    .pipe(gulp.dest(opt.testEspowered));
});
gulp.task('mocha', function() {
  return gulp.src(`${opt.testEspowered}/**/*.js`)
    .pipe(mocha({reporter: 'spec'}))
});
gulp.task('test', function(done) {
  seq('ts:src_', ['babel:src', 'babel:test'], 'espower', 'mocha', done)
  .on('error', function(err) {
    process.exit(1);
  });
});