module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    connect: {
      server: {
        options: {
          port: 9000,
          base: '.'
        }
      }
    },
    optimize: {
      'engine': 'Engine',
      'bpmn' : 'Bpmn'
    },
    watch: {
      files: 'src/**/*',
      tasks: [ 'optimize' ]
    },
    requirejs: {
      compile: {
        options: {
          name : "bpmn/<%= grunt.config.get('optimizeName') %>",
          baseUrl: "./",
          paths: {
            "dojox/gfx": "empty:",
            "jquery": "empty:"
          },
          packages: [
            { name: "dojo", location: "lib/dojo/dojo" },
            { name: "dojox", location: "lib/dojo/dojox"},
            { name: "bpmn", location: "src/bpmn"}],
          out: "build/<%= grunt.config.get('optimizeName').toLowerCase() %>.min.js"
        }
      }
    }
  });

  // r.js optimizer for requirejs will not work for the renderer, because there are circular dependencie in dojo
  // we will need to use the dojo build tool to create a single file build for that
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.loadNpmTasks( 'grunt-contrib-connect');
  grunt.loadNpmTasks( 'grunt-contrib-watch' );

  // Default task(s).
  grunt.registerTask( 'default', [ 'optimize' ]);
  grunt.registerTask( 'server', [ 'connect:server'] );

  grunt.registerMultiTask( 'optimize', 'optimize the project', function() {

    var name = this.data;
    
    grunt.config.set('optimizeName', name);
    grunt.task.run('requirejs');
  });
};
