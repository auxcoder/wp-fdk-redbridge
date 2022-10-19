const postcssEach = require('postcss-each');
const postcssMixins = require('postcss-mixins');
const postcssNested = require('postcss-nested');
const postcssNestedProps = require('postcss-nested-props');
const postcssSimpleVars = require('postcss-simple-vars');
const posthtml = require('gulp-posthtml');
const tap = require('gulp-tap');
const postcss = require('gulp-postcss');
const postcssEasyMediaQuery = require('postcss-easy-media-query');
const postcssFontpath = require('postcss-fontpath');
const postcssImport = require('postcss-import');
const postcssReporter = require('postcss-reporter');
const posthtmlBem = require('posthtml-bem');
const fs = require('fs');
const path = require('path');
const autoprefixer = require('autoprefixer');
const browserSync = require('browser-sync').create();
const changed = require('gulp-changed');
const cssNano = require('gulp-cssnano');
const del = require('del');
const exec = require('child_process').execSync;
const gulp = require('gulp');
const imagemin = require('gulp-imagemin');
const mergeStream = require('merge-stream');
const named = require('vinyl-named');
const postHtml = require('gulp-posthtml');
const rename = require('gulp-rename');
const sass = require('gulp-dart-sass');
const sourcemaps = require('gulp-sourcemaps');
const stylelint = require('stylelint');
const uglify = require('gulp-uglify');
const webpack = require('webpack-stream');
const yaml = require('js-yaml');
const {error} = require('console');
// Initialize assets timestamps, later set by respective functions, and used by functions()
let scriptBuildTime, styleBuildTime;

// Load project settings
let packageData = {};
try {
  packageData = require('./src/package.json');
} catch (error) {
  console.error('Error loading source `package.json` file.', error);
}

const settings = {
  slug: packageData.name,
  title: packageData.description,
  author: packageData.author
};

// set settings for Docker, Web and DB ports
try {
  settings.webPort = exec('docker-compose port web 80').toString().replace(/^.*:(\d+)\n$/g, '$1');
  settings.dbPort = exec('docker-compose port db 3306').toString().replace(/^.*:(\d+)\n$/g, '$1');
} catch (error) {
  console.error('Error obtaining containers access ports.', error);
}

// Load optional imports file
try {
  settings.imports = yaml.load(fs.readFileSync('./config/imports.yml', 'utf8'));
} catch (error) {
  console.error('error loading imports.yml:', error);
  settings.imports = {}; // ignore
}
settings.imports.plugins = settings.imports.plugins || [];
settings.imports.plugins = settings.imports.plugins.map(function(pluginOrPath) {
  const plugin = (pluginOrPath instanceof Object) ? pluginOrPath : { path: pluginOrPath };
  plugin.path = path.resolve(plugin.path.replace(/^~/, require('os').homedir()));
  plugin.watch = plugin.watch || '**/*.{php,css,js}';
  plugin.watchPath = path.join(plugin.path, plugin.watch);
  plugin.include = plugin.include || '**';
  plugin.src = [path.join(plugin.path, plugin.include)];
  if (plugin.exclude) plugin.src.push('!' + path.join(plugin.path, plugin.exclude));

  return plugin;
});

// Paths for remapping
const base = {
  dev: './',
  src: './src/',
  acfRelativeSrc: '../../../../src/',
  theme: './www/wp-content/themes/' + settings.slug + '/',
  plugins: './www/wp-content/plugins/'
};

// Source files for compilation
const src = {
  functions: base.src + 'includes/*.php',
  includes: base.src + 'includes/**/*.php',
  controllers: base.src + 'templates/controllers/**/*.php',
  views: base.src + 'templates/views/**/*.twig',
  images: base.src + 'assets/img/**/*',
  fonts: base.src + 'assets/fonts/**/*',
  styles: base.src + 'assets/css/*.scss',
  stylesGlob: base.src + 'assets/**/*.scss', /* also watch included files */
  scripts: base.src + 'assets/js/*.js',
  scriptsGlob: base.src + 'assets/js/**/*.js' /* also watch included files */
};

// Build folder slugs
var dest = {
  acf: 'acf-json',
  includes: 'inc',
  controllers: '', // Templates go in the theme's root folder
  views: 'views',
  styles: 'css',
  scripts: 'js',
  images: 'img',
  fonts: 'fonts'
};

// Plugin options
var options = {
  uglify: { mangle: false },
  imageminPlugins: imagemin.svgo({
    plugins: [
      {
        name: 'cleanupIDs',
        active: false
      }
    ]
  }),
  imagemin: { optimizationLevel: 7, progressive: true, interlaced: true, multipass: true },
  postcss: [
    postcssImport({ plugins: [stylelint()] }),
    postcssEasyMediaQuery,
    postcssMixins,
    postcssEach,
    postcssSimpleVars,
    postcssSimpleVars({
      variables: {blue: '#056ef0'},
      unknown:  function (node, name, result) {
        node.warn(result, 'Unknown variable ' + name);
      }
    }),
    postcssNestedProps,
    postcssNested,
    postcssFontpath,
    autoprefixer(),
    postcssReporter({clearReportedMessages: true})
  ],
  posthtmlBem: {
    elemPrefix: '__',
    modPrefix: '--',
    modDlmtr: '-'
  }
};

// Erase build and theme folders before each compile
function clean() {
  return del([base.theme], {force: true})
    .then(function () {
      fs.mkdirSync(base.theme);
    });
}

// Header: auto-create style.css using project info we already have
function header(cb) {
  var data = '/*\r\n'
    + 'Theme Name: ' + settings.title + '\r\n'
    + 'Author: ' + settings.author['name'] + '\r\n'
    + (settings.author['url'] ? 'Author URI: ' + settings.author['url'] + '\r\n' : '')
    + '*/';
  fs.writeFileSync(base.theme + 'style.css', data);
  cb();
}

// Acf: create a symlink to ACF JSON in theme folder so that the source and theme are always in sync
function acf(cb) {
  // Symlink to absolute path in VM (it must be synced on the guest but not necessarily on the host)
  fs.symlinkSync(base.acfRelativeSrc + dest.acf, base.theme + dest.acf);
  cb();
}
// Includes: copy all project and vendor includes
function includes() {
  return gulp.src(src.includes)
    .pipe(changed(base.theme + dest.includes))
    .pipe(gulp.dest(base.theme + dest.includes))
    .pipe(browserSync.stream());
}

// Controllers: copy PHP files
function controllers() {
  return gulp.src(src.controllers)
    .pipe(changed(base.theme + dest.controllers))
    .pipe(gulp.dest(base.theme + dest.controllers))
    .pipe(browserSync.stream());
}

// Views: copy Twig files
function views() {
  return gulp.src(src.views)
    .pipe(changed(base.theme + dest.views))
    .pipe(posthtml([posthtmlBem(options.posthtmlBem)]))
    .pipe(gulp.dest(base.theme + dest.views))
    .pipe(browserSync.stream());
}

// Styles (CSS): lint write source map, preprocess, save full and minified versions, then copy
function styles() {
  styleBuildTime = new Date().getTime();
  return gulp.src(src.styles)
    .pipe(
      sass({ outputStyle: 'expanded' })
        .on('error', function (err) {
          console.error(err.message)
          this.emit('end')
        })
    )
    .pipe(named())
    .pipe(postcss(options.postcss))
    .on('error', function(error) {
      console.error(error.message);
      this.emit('end');
    })
    .pipe(sourcemaps.init())
    .pipe(gulp.dest(base.theme + dest.styles))
    .pipe(browserSync.stream())
    .pipe(cssNano())
    .on('error', function(error) {
      console.error(error.message)
      this.emit('end')
    })
    .pipe(rename({
      suffix: `.${styleBuildTime}.min`
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(base.theme + dest.styles))
    .pipe(browserSync.stream());
}

// Scripts (JS): get third-party dependencies, concatenate all scripts into one file, save full and minified versions, then copy
function scripts() {
  scriptBuildTime = new Date().getTime();
  return gulp.src(src.scripts)
    // @ts-ignore
    .pipe(named())
    // @ts-ignore
    .pipe(webpack(require('./webpack.config.js')))
    .on('error', function (error) {
      console.error(error.message);
      this.emit('end');
    })
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(gulp.dest(base.theme + dest.scripts))
    .pipe(browserSync.stream())
    .pipe(uglify(options.uglify))
    .pipe(rename(function (path) {
      path.basename += '.' + scriptBuildTime + ".min";
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(base.theme + dest.scripts))
    .pipe(browserSync.stream());
}

// Functions: auto-create functions.php with root level PHP includes and assets timestamp constants
function functions(cb) {
  fs.writeFileSync(base.theme + 'functions.php', '<?php\r\ndefine(\'SCRIPT_BUILD_TIME\', \'' + scriptBuildTime + '\');\r\ndefine(\'STYLE_BUILD_TIME\', \'' + styleBuildTime + '\');\r\n');
  return gulp.src(src.functions)
    .pipe(tap(function (file) {
      fs.appendFileSync(base.theme + 'functions.php', "require_once(get_stylesheet_directory() . '/" + dest.includes + file.path.replace(file.base, '') + "');\r\n");
    }));
}

function images () {
  return gulp.src(src.images)
    .pipe(changed(base.theme + dest.images))
    .pipe(imagemin([
      options.imageminPlugins,
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.gifsicle({
        interlaced: true,
        optimizationLevel: 7
      }),
      imagemin.mozjpeg({
        quality: 75,
        progressive: true
      })
    ]))
    // .pipe(imagemin([options.imageminPlugins, options.imagemin]))
    .pipe(gulp.dest(base.theme + dest.images))
    .pipe(browserSync.stream())
}

// Fonts: just copy, maintaining tree
function fonts() {
  return gulp.src(src.fonts)
    .pipe(changed(base.theme + dest.fonts))
    .pipe(gulp.dest(base.theme + dest.fonts))
    .pipe(browserSync.stream());
}

// Imports: extra folders to be copied
function importsPlugins(cb) {
  console.log('Starting importing plugins in dev...');
  const importsPipes = [];
  settings.imports.plugins.forEach(function (plugin) {
    // todo: check if path is valid
    importsPipes.push(
      gulp.src(plugin.src, { base: path.dirname(plugin.path) })
        .pipe(changed(base.plugins))
        .pipe(gulp.dest(base.plugins))
        .pipe(browserSync.stream())
    )
  });
  if (importsPipes.length > 0) {
    return mergeStream(importsPipes);
  }
  cb();
}

// Wordmove: add full Wordpress path to the final Movefile with the almost complete template
function wordMove(cb) {
  const database = {
    name: 'wordpress',
    user: 'wordpress',
    password: 'wordpress',
    host: '127.0.0.1',
    port: settings.dbPort
  };
  const local = {
    vhost: `localhost:${settings.webPort}`,
    wordpress_path: path.resolve(`${__dirname}/www/`),
    database: database
  }

  try {
    // Load settings file
    const config = yaml.load(fs.readFileSync('./config/wordmove.yml', 'utf8')) || {};
    const wordMove = Object.assign({local}, config)
    //
    wordMove.local.vhost = `localhost:${settings.webPort}`;
    wordMove.local.wordpress_path = path.resolve(`${__dirname}/www/`);
    fs.writeFileSync('Movefile', yaml.dump(wordMove));
  } catch (ex) {
    console.error('Error generating Movefile:', ex);
  }
  cb();
}

// Update WP config URLs with access port dynamically assigned by Docker to expose Web container port 80
function wpconfig(cb) {
  // Get current port in WordPress to check if it matches the current Web container port
  var dockerCmd = 'docker-compose exec -u www-data -T wp',
    wpPort = exec(dockerCmd + ' wp option get siteurl').toString().replace(/^.*:(\d+)\n$/g, '$1');
  if (wpPort != settings.webPort) {
    // Ports needs to be updated
    console.log('Updating WordPress port from ' + wpPort + ' to ' + settings.webPort + '...');
    exec(dockerCmd + ' wp search-replace --quiet "localhost:' + wpPort + '" "localhost:' + settings.webPort + '"');
    exec(dockerCmd + ' bash -c \'wp option update home "http://localhost:' + settings.webPort + '" && wp option update siteurl "http://localhost:' + settings.webPort + '"\'');
  }
  var outputSeparator = ' \x1b[36m' + '-'.repeat(37 + settings.webPort.toString().length) + '\x1b[0m';
  console.log('\x1b[1m' + settings.title + ' (' + settings.slug + ') access URLs:\x1b[22m');
  console.log(outputSeparator);
  console.log(' 🌍  WordPress: \x1b[35mhttp://localhost:' + settings.webPort + '/\x1b[0m');
  console.log(' 🔧  Admin: \x1b[35mhttp://localhost:' + settings.webPort + '/wp-admin/\x1b[0m');
  console.log(' 🗃  Database: \x1b[35mlocalhost:' + settings.dbPort + '\x1b[0m');
  console.log(outputSeparator);
  cb();
}

function watch() {
  // Initialize BrowserSync
  console.log('Starting BrowserSync...');
  browserSync.init({
    proxy: 'localhost:' + settings.webPort,
    open: false,
    logPrefix: settings.slug + ' http://localhost:' + settings.webPort
  });
  gulp.watch(src.functions, gulp.series(functions));
  gulp.watch(src.includes, gulp.series(includes));
  gulp.watch(src.controllers, gulp.series(controllers));
  gulp.watch(src.views, gulp.series(views));
  gulp.watch(src.stylesGlob, gulp.series(styles, functions));
  gulp.watch(src.scriptsGlob, gulp.series(scripts, functions));
  gulp.watch(src.images, gulp.series(images));
  gulp.watch(src.fonts, gulp.series(fonts));
  settings.imports.plugins.forEach(function (plugin) {
    gulp.watch(plugin.watchPath, gulp.series(importsPlugins));
  });
}

function deploy(cb) {
  exec('wordmove push --themes', { stdio: 'inherit' });
  cb();
}

// Build: sequences all the other tasks
// gulp.task('build', gulp.series(clean, gulp.parallel(header, acf, includes, controllers, views, styles, scripts, functions, images, fonts, imports, wordMove)));
const build = gulp.series(clean, gulp.parallel(header, acf, includes, controllers, views, styles, scripts, functions, images, fonts, importsPlugins, wordMove));

// Wpconfig: update Docker dynamic ports in Wordpress config
// gulp.task('wpconfig', wpconfig);

// Watch: fire build, then watch for changes
// gulp.task('default', gulp.series('build', 'wpconfig', watch));
const dev = gulp.series(build, wpconfig, watch)

// Deploy: run another build (clean folders etc) and then wordmove
// gulp.task('deploy', gulp.series('build', deploy));
const deployBuild = gulp.series(build, deploy)

module.exports = {
	build: build,
	wpconfig: wpconfig,
	default: dev,
  deploy: deployBuild,
};
