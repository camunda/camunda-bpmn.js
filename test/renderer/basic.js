/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *      http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";

define(["bpmn/Bpmn", "bpmn/Transformer", "test/util/TestHelper"], function(Bpmn, Transformer, helper) {

return describe('Basic Renderer Functionality', function() {

  it('should render all task types', function() {
    afterEach(function () {

    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/task_types.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      // there should be 9 rect task shapes
      expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "rect").length).toBe(9);
    });

  });

  it('should render a call activity', function() {
    afterEach(function () {

    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/call_activity.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "rect").length).toBe(1);
    });

  });

  it('should render a subprocess', function() {
    afterEach(function () {

    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/subprocess_event.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(helper.findChildrenByProperties(bpmn.definitionRenderer.gfxGroup, { type: "text", text: "meal preparations" }).length).toBe(1);
      expect(helper.findChildrenByProperties(bpmn.definitionRenderer.gfxGroup, { type: "text", text: "provide meal" }).length).toBe(1);
    });

  });

  it('should wordwrap long single word labels', function() {
    afterEach(function () {

    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/test-wordwrap.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
      });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(helper.findChildrenByProperties(bpmn.definitionRenderer.gfxGroup, { type: "text", text: "dadadadadada" }).length).toBe(3);
      expect(helper.findChildrenByProperties(bpmn.definitionRenderer.gfxGroup, { type: "text", text: "dadadadbatman" }).length).toBe(1);
    });

  });

  it('should render all events', function() {
    afterEach(function () {

    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/events.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "circle").length).toBe(41);
    });

  });

  it('should render basic event types', function() {
    afterEach(function () {

    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/event-based-events.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
      });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 5000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "circle").length).toBe(12);
    });

  });

  it('should render activity markers', function() {
    afterEach(function () {

    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/markers.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
      });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 5000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      // should render all marker paths
      expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "path").length).toBe(9);
    });

  });

  it('should render labels correctly', function() {
    afterEach(function () {

    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/test-labels-basic.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
      rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 5000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      var labels = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "text");
      expect(labels.length).toBe(3);

      // label padding is included
      expect([labels[2]]).toHavePositions([{x : 535, y: 302}]);
    });

  });

  it('should render labels in collaboration correctly', function() {
    afterEach(function () {
    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/test-labels-collaboration.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
      });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 5000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      var label = helper.findChildrenByProperties(bpmn.definitionRenderer.gfxGroup, {"type" : "text", "text": "review"});
      expect(label.length).toBe(1);
      // gateway has label position
      expect(label).toHavePositions([{x : 658, y: 119}]);
    });
  });

  it('should render all boundary events', function() {
    afterEach(function () {
    });

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/boundary_events.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
      });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 5000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "circle").length).toBe(34);
      expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "rect").length).toBe(17);
    });

  });

  it('should not render non-existing label on pools / lanes', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/collaboration-empty-label.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      // there should be 9 rect task shapes
      expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "text").length).toBe(0);
    });
  });

  it('should render boundary event in front of task', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/boundary-behind-task.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      var task = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "rect")[0];
      var boundary = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "circle")[0];

      expect(task).toBeInFrontOf(boundary);
    });
  });

  it('should render collapsed pool', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/collapsed-pool.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      var pool = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "rect")[0];
      var poolLabel = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "text")[0];

      expect(pool).toBeDefined();
      expect(poolLabel).toBeDefined();
    });
  });


  it('should render directed association with arrow', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/directed-association.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      var paths = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "path");

      // two associations + dataobject edge
      expect(paths.length).toBe(3);
    });
  });

  it('should render data objects', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/data-object.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      var objects = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "path");
      var lines = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "polyline");
      var texts = helper.findChildrenByProperties(bpmn.definitionRenderer.gfxGroup, { type: "text", text: "I AM DATA" });

      // two objects
      expect(objects.length).toBe(2);

      // on text
      expect(texts.length).toBe(1);

      // one association
      expect(lines.length).toBe(1);
    });
  });

  it('should render message flow', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/collaboration-message-flow.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      var paths = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "path");

      // message flow
      expect(paths.length).toBe(1);
    });
  });

  it('should render message flow with message attached', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/collaboration-message-flow-message.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      var paths = helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "path");
      var texts = helper.findChildrenByProperties(bpmn.definitionRenderer.gfxGroup, { type: "text", text: "My Message" });

      // 2x (message flow + message)
      expect(paths.length).toBe(4);

      // text exists
      expect(texts.length).toBe(1);
    });
  });

  it('should render complex test', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/complex.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      // there should be 9 rect task shapes
      // expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "rect").length).toBe(9);
    });

  });

  it('should render complex test (waitstates, subprocesses)', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/complex-waitstates-subprocesses.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      // there should be 9 rect task shapes
      // expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "rect").length).toBe(9);
    });

  });

  xit('should render two tasks with boundary events on top of each other', function() {

    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/BoundaryEventStack.bpmn", {
      diagramElement : "canvas"
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      // there should be 9 rect task shapes
      // expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "rect").length).toBe(9);
    });

  });  
  });

});