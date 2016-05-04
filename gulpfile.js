var source = require('vinyl-source-stream');
var gulp = require('gulp');
var gutil = require('gulp-util');
var browserify = require('browserify');
var babelify = require('babelify');
var watchify = require('watchify');
var notify = require('gulp-notify');
var sass = require('gulp-sass');
var autoprefixer = require('gulp-autoprefixer');
// var browserSync = require('browser-sync').create();
var plumber = require('gulp-plumber');

var stylus = require('gulp-stylus');
var autoprefixer = require('gulp-autoprefixer');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
// var buffer = require('vinyl-buffer');

// var reload = browserSync.reload;
var historyApiFallback = require('connect-history-api-fallback')
// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
'react', 'react-dom'
];
var scriptsCount = 0;

function customPlumber(){
  return plumber({
    errorHandler: function(err){
      console.log(err.stack)
      this.emit('emit')
    }
  })
}


// Gulp tasks
// ----------------------------------------------------------------------------
gulp.task('scss', function(){
  return gulp.src('style/scss/*.scss')
    .pipe(customPlumber())
    .pipe(sass({
      includePaths: ['./node_modules']
    }))
    .pipe(autoprefixer({
      browsers: ['last 5 versions']
    }))
    .pipe(gulp.dest('style/css'))
});

gulp.task('scripts', function () {
    bundleApp(false);
});

gulp.task('deploy', function (){
	bundleApp(true);
});

gulp.task('watch', function () {
	gulp.watch(['./scripts/*.js'], ['scripts']);
  gulp.watch(['style/scss/*.scss'], ['scss']);
  gulp.watch('index.html', browserSync.reload);
});

// gulp.task('browserSync', function(){
//   browserSync.init({
//     server: {
//       baseDir: './'
//     }
//   })
// });

// When running 'gulp' on the terminal this task will fire.
// It will start watching for changes in every .js file.
// If there's a change, the task 'scripts' defined above will fire.
gulp.task('default', ['scripts','watch', 'scss']);

// Private Functions
// ----------------------------------------------------------------------------
function bundleApp(isProduction) {
	scriptsCount++;
	// Browserify will bundle all our js files together in to one and will let
	// us use modules in the front end.
	var appBundler = browserify({
    	entries: './scripts/main.js',
    	debug: true
  	})

	// If it's not for production, a separate vendors.js file will be created
	// the first time gulp is run so that we don't have to rebundle things like
	// react everytime there's a change in the js file
  	if (!isProduction && scriptsCount === 1){
  		// create vendors.js for dev environment.
  		browserify({
			require: dependencies,
			debug: true
		})
			.bundle()
			.on('error', gutil.log)
			.pipe(source('something.js'))
			.pipe(gulp.dest('./web/js'));
  	}
  	if (!isProduction){
  		// make the dependencies external so they dont get bundled by the
		// app bundler. Dependencies are already bundled in vendor.js for
		// development environments.
  		dependencies.forEach(function(dep){
  			appBundler.external(dep);
  		})
  	}

  	appBundler
  		// transform ES6 and JSX to ES5 with babelify
	  	.transform("babelify", {presets: ["es2015", "react"]})
	    .bundle()
	    .on('error',gutil.log)
	    .pipe(source('bundle.js'))
	    .pipe(gulp.dest('./web/js'));
}
