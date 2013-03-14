camunda-bpmn.js
==========

camunda BPMN Javascript libraries for parsing, executing and rendering BPMN 2.0 with Java Script. 

* Web Site: http://www.camunda.org/
* Issue Tracker: TODO
* Contribution Guildelines: http://www.camunda.org/app/community-contribute.html
* License: Apache License, Version 2.0  http://www.apache.org/licenses/LICENSE-2.0

Components
---------
 * Transformer - The Transformer Module is responsible for parsing a BPMN 2.0 Xml File and transforming it into a Java Script object model. The same object model can then be passed to the Executor and the Renderer.
* Executor - The Executor module is a lightweight Process Engine completely written in Java Script.
* Renderer - The Renderer module is capable of rendering BPMN 2.0 Diagram.

Getting Started
---------
The entry point to the API is the Bpmn Class.

#### Bootstrapping the Renderer
The Renderer uses [dojo gfx](http://dojotoolkit.org/reference-guide/1.8/dojox) for abstracting SVG and HTML5 Canvas as underlying graphics technology.

You must first include the dojo bootstrap library:
```html
<script src="lib/dojo/dojo/dojo.js"
  data-dojo-config="async: true, parseOnLoad: true, forceGfxRenderer: 'svg'">
</script>
```

Now you can asynchronously load all required libraries. Assuming that the dojo distribution is located under `lib` and camunda-bpmn.js is located under `src/`:
```javascript
require({
  baseUrl: "./",
  packages: [
    { name: "dojo", location: "lib/dojo/dojo" },
    { name: "dojox", location: "lib/dojo/dojox"},
    { name: "bpmn", location: "src/bpmn"}]
});
```

And finally load & render the process diagram
```javascript
require(["bpmn/Bpmn", "dojo/domReady!"], function(Bpmn) {
  new Bpmn().renderUrl("test/resources/task_loop.bpmn", {
    diagramElement : "diagram",
    overlayHtml : '<div style="position: relative; top:100%"></div>'
  }).then(function (bpmn){
    bpmn.zoom(0.8);
    bpmn.annotate("reviewInvoice", '<span class="bluebox"  style="position: relative; top:100%">New Text</span>', ["highlight"]);
  });
});
```
