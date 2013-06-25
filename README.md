camunda-bpmn.js
===============

camunda BPMN JavaScript libraries for parsing, executing and rendering BPMN 2.0 with JavaScript. 

* [Web Site](http://www.camunda.org/)
* [Issue Tracker](https://app.camunda.com/jira)
* [Contribution Guildelines](http://www.camunda.org/community/contribute.html)
* License: [Apache License, Version 2.0](http://www.apache.org/licenses/LICENSE-2.0)


Components
---------

 * *Transformer* - Supports parsing a BPMN 2.0 XML File and transforming it into a JavaScript object model. The same object model can then be passed to the Executor and the Renderer.
 * *Engine* - Lightweight Process Engine completely written in JavaScript.
 * *Renderer* - Allows rendering BPMN 2.0 Diagrams using SVG or HTML5 Canvas.


Getting Started
---------

The entry point to the API is the Bpmn Class.


#### Bootstrapping the Renderer

The Renderer uses [Dojo GFX](http://dojotoolkit.org/reference-guide/1.8/dojox) for abstracting SVG and HTML5 Canvas as underlying graphics technology.
Additionally it relies on [jQuery](http://jquery.com) for DOM manipulation.

You must first include a [AMD compliant script loader](https://github.com/amdjs/amdjs-api/wiki/AMD), such as [Dojo](http://dojotoolkit.org/) or [RequireJS](http://requirejs.org).

To use plain RequireJS, [download](http://requirejs.org/docs/download.html#requirejs) and include it into the site:

```html
<script src="lib/require/require.min.js"></script>
```

Now you need to configure the path to the dependencies `dojo`, `dojo.gfx` and `jquery` in a require config. 
Assuming that the camunda-bpmn.js libraries are located under `lib/camunda-bpmn` and dojo is stored under `lib/dojo`:

```html
<script src="lib/jquery/jquery-1.7.2.min.js"></script>

<!-- found in project as build/bpmn.min.js -->
<script src="lib/camunda-bpmn/bpmn.min.js"></script>

<!-- or include minified engine, if you need only that -->
<script src="lib/camunda-bpmn/engine.min.js"></script>
```

```javascript
require({
  baseUrl: "./",
  packages: [
    { name: "dojo", location: "lib/dojo/dojo/" },
    { name: "dojox", location: "lib/dojo/dojox" }
  ]
});
```

Finally, you can load the renderer and draw a process diagram.

```javascript
require([ "bpmn/Bpmn" ], function(Bpmn) {
  new Bpmn().renderUrl("test/resources/task_loop.bpmn", {
    diagramElement : "diagram",
    overlayHtml : '<div style="position: relative; top:100%"></div>'
  }).then(function(bpmn){
    bpmn.zoom(0.8);
    bpmn.annotate("reviewInvoice", '<span class="bluebox"  style="position: relative; top:100%">New Text</span>', ["highlight"]);
  });
});
```


API
===

Check out the file `src/bpmn/Bpmn.js` for the API of the library.


Development
===========

We are using [Grunt](http://gruntjs.com) for building and testing the code.
It can be installed using:

1. Install [node.js](http://nodejs.org/).
2. Open a terminal, navigate to the `site/` folder and type `npm install`
3. Install Grunt's command line interface (CLI) globally using `npm install -g grunt-cli`

After Grunt is installed you can use it like this:

1. Run `grunt requirejs` to optimize and minify the JavaScript code into the `build/` folder.
2. Run `grunt server watch` to start a web server at localhost:9000
3. Open [localhost:9000/test/runner.html](http://localhost:9000/test/runner.html) to execute the jasmine tests in your browser while running the grunt server.
4. Open [localhost:9000/demo.html](http://localhost:9000/demo.html) to see the demo.