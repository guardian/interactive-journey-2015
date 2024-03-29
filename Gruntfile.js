'use strict';
var pkg = require('./package.json');
var currentTime = +new Date();
var versionedAssetPath = 'assets-' + currentTime;
var CDN = 'https://interactive.guim.co.uk/';
var deployAssetPath = CDN + pkg.config.s3_folder + versionedAssetPath;
var localAssetPath = 'http://localhost:' + pkg.config.port + '/assets';

module.exports = function(grunt) {
  var isDev = !(grunt.cli.tasks && grunt.cli.tasks[0] === 'deploy');
  grunt.initConfig({

    connect: {
      server: {
        options: {
          port: pkg.config.port,
          hostname: '*',
          base: './build/',
          middleware: function (connect, options, middlewares) {
            // inject a custom middleware http://stackoverflow.com/a/24508523 
            middlewares.unshift(function (req, res, next) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.setHeader('Access-Control-Allow-Methods', '*');
                return next();
            });
            return middlewares;
          }
        }
      }
    },

    bowerRequirejs: {
        all: {
            rjsConfig: './src/js/require.js',
            options: {
                baseUrl: './src/js/'
            }
        }
    },

    sass: {
      options: {
            style: (isDev) ? 'expanded' : 'compressed',
            sourcemap: 'inline'
       },
        build: {
            files: { 'build/assets/css/main.css': 'src/css/main.scss' }
        }
    },

    autoprefixer: {
        options: {
            map: true
        },
        css: { src: 'build/assets/css/*.css' }
    },

    clean: ['build/'],

    jshint: {
      options: {
          jshintrc: true,
          force: true 
      },
        files: [
            'Gruntfile.js',
            'src/**/*.js',
            '!src/js/require.js',
            '!src/js/libs/**/*js'
        ]
    },

    requirejs: {
      compile: {
        options: {
          baseUrl: './src/js/',
          mainConfigFile: './src/js/require.js',
          optimize: (isDev) ? 'none' : 'uglify2',
          uglify2: {
            compress: {
              drop_debugger: true,
              drop_console: true,
              unused: true,
              dead_code: true
            },
            warnings: false,
            mangle: true
          },
          inlineText: true,
          name: 'almond',
          out: 'build/assets/js/main.js',
          generateSourceMaps: true,
          preserveLicenseComments: false,
          include: ['main'],
          wrap: {
            start: 'define(["require"],function(require){var req=(function(){',
            end: 'return require; }()); return req; });'
          }

        }
      }
    },

    watch: {
      scripts: {
        files: [
          'src/**/*.js',
          'src/**/*.json',
          'src/js/templates/*.html',
          'src/js/data/*.txt'
        ],
        tasks: ['jshint', 'requirejs', 'replace:local'],
        options: {
          spawn: false,
          livereload: true
        },
      },
      html: {
        files: ['src/*.html', 'src/embed/*.html'],
        tasks: ['copy', 'replace:local'],
        options: {
          spawn: false,
          livereload: true
        },
      },
      css: {
        files: ['src/css/**/*.*'],
        tasks: ['sass', 'autoprefixer', 'replace:local'],
        options: {
          spawn: false,
          livereload: true
        },
      }
    },

    copy: {
      build: {
        files: [
          {
              cwd: 'src/',
              src: ['index.html', 'boot.js', 'embed/*.*'],
              expand: true,
              dest: 'build/'
          },
          {
              src: 'bower_components/curl/dist/curl/curl.js',
              dest: 'build/assets/js/curl.js'
          }
        ]
      },
      images: { files: [
         {
              cwd: 'src/',
              src: ['imgs/**/*.*'],
              expand: true,
              dest: 'build/assets/'
          }
      ]}
    },

    imagemin: {
      options: {
        optimizationLevel: 3,
        svgoPlugins: [{ removeViewBox: false }],
      },
      dynamic: {
        files: [{
          expand: true,
          cwd: 'src/',
          src: ['imgs/**/*.{png,jpg,gif,svg}'],
          dest: 'build/assets/'
        }]
      }
    },

    replace: {
        prod: {
            options: {
                patterns: [{
                  match: /@@assetPath@@/g,
                  replacement: deployAssetPath 
                }]
            },
            files: [{
                src: ['build/**/*.html', 'build/**/*.js', 'build/**/*.css'],
                dest: './'
            }]
        },
        local: {
            options: {
                patterns: [{
                  match: /@@assetPath@@/g,
                  replacement: localAssetPath
                }]
            },
            files: [{
                src: ['build/**/*.html', 'build/**/*.js', 'build/**/*.css'],
                dest: './'
            }]
        }
    },

    s3: {
        options: {
            access: 'public-read',
            bucket: 'gdn-cdn',
            maxOperations: 20,
            dryRun: (grunt.option('test')) ? true : false,
            headers: {
                CacheControl: 180,
            },
            gzip: true,
            gzipExclude: ['.jpg', '.gif', '.jpeg', '.png']
        },
        base: {
            files: [{
                cwd: 'build',
                src: ['*.*', 'embed/*.*'],
                dest: pkg.config.s3_folder
            }]
        },
        assets: {
            options: {
                headers: {
                    CacheControl: 3600,
                }
            },
            files: [{
                cwd: 'build',
                src: versionedAssetPath + '/**/*.*',
                dest: pkg.config.s3_folder
            }]
        }
    },

    rename: {
        main: {
            files: [
                {
                    src: 'build/assets',
                    dest: 'build/' + versionedAssetPath
                }
            ]
        }
    },
    
    'compile-handlebars': {
      facebookInstant: {
          templateData: 'temp/pageData.json',
          partials: 'src/facebook-instant/partials/*.html',
          helpers: [
            'src/facebook-instant/helpers/partial.js',
            'src/facebook-instant/helpers/splitcopy.js',
            'src/facebook-instant/helpers/mediatype.js',
            'src/facebook-instant/helpers/imagesize.js'
          ],
          files: [{
            src: 'src/facebook-instant/facebook-instant-base.html',
            dest: 'build/fb.html'
          }]
      }
    },

    curl: {
      'temp/pageData.json': 'http://interactive.guim.co.uk/docsdata-test/' +
                            '1fELDqgjhldHT-uHWxtMKz4ZjiMLbzb9MwUV6lW8TjAo.json'
    }  

  });

  // Task pluginsk
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks('grunt-sass');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-aws');
  grunt.loadNpmTasks('grunt-autoprefixer');
  grunt.loadNpmTasks('grunt-replace');
  grunt.loadNpmTasks('grunt-contrib-rename');
  grunt.loadNpmTasks('grunt-bower-requirejs');
  grunt.loadNpmTasks('grunt-compile-handlebars');
  grunt.loadNpmTasks('grunt-curl');

  // Tasks
  grunt.registerTask('build', [
    'jshint',
    'clean',
    'sass',
    'autoprefixer',
    'bowerRequirejs',
    'requirejs',
    'copy:build'
  ]);
  
  grunt.registerTask('default', [
      'build',
      'copy:images',
      'replace:local',
      'connect',
      'watch'
  ]);
  
  grunt.registerTask('deploy', [
      'build',
      'imagemin',
      'rename',
      'replace:prod',
      's3'
  ]);
  
  grunt.registerTask('facebook-instant', [
      'clean',
      'curl',
      'compile-handlebars'
  ]);
  
};
