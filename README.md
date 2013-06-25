camunda-bpmn.js
==========

camunda BPMN Javascript libraries for parsing, executing and rendering BPMN 2.0 with Java Script. 

* Web Site: http://www.camunda.org/
* Issue Tracker: Issue Tracker: https://app.camunda.com/jira
* Contribution Guildelines: http://www.camunda.org/community/contribute.html
* License: Apache License, Version 2.0  http://www.apache.org/licenses/LICENSE-2.0


Components
---------

 * *Transformer* - Supports parsing a BPMN 2.0 Xml File and transforming it into a Java Script object model. The same object model can then be passed to the Executor and the Renderer.
 * *Engine* - Lightweight Process Engine completely written in Java Script.
 * *Renderer* - Allows rendering BPMN 2.0 Diagrams using SVG or HTML5 Canvas.


Getting Started
---------

The entry point to the API is the Bpmn Class.


#### Bootstrapping the Renderer

The Renderer uses [dojo gfx](http://dojotoolkit.org/reference-guide/1.8/dojox) for abstracting SVG and HTML5 Canvas as underlying graphics technology.
Additionally it relies on [JQuery](http://jquery.com) for DOM manipulation.

You must first include a [AMD compliant script loader](http://requirejs.org), such as [Dojo](http://dojotoolkit.org/) or [RequireJS](http://requirejs.org).

To use plain RequireJS, [download](http://requirejs.org/docs/download.html#requirejs) and include it into the site:

```html
<script src="lib/require/require.min.js"></script>
```

Now you need to configure the path to the dependencies `dojo`, `dojo.gfx` and `jquery` in a require config. 
Assuming that the camunda-bpmn.js libraries are located under `lib/cabpmn` and dojo is stored under `lib/dojo`:

```html
<script src="lib/jquery/jquery-1.7.2.min.js"></script>

<!-- found in project as build/bpmn.min.js -->
<script src="lib/cabpmn/bpmn.min.js"></script>

<!-- or include minified engine, if you need only that -->
<script src="lib/cabpmn/engine.min.js"></script>
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

We are using gruntjs:

```
grunt server watch  # start a web server at localhost:9000
grunt requirejs # optimzises and minifies the engine into 'optimized' folder
```

Open [localhost:9000/test/runner.html](http://localhost:9000/test/runner.html) too execute the jasmine tests in your browser while running the grunt server.
