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

define(["jquery", "bpmn/Bpmn", "bpmn/Transformer", "test/util/TestHelper"], function($, Bpmn, Transformer, helper) {

  return describe('Basic Renderer Functionality', function() {

    var canvas;
    var diagram;
    var i = 0;

    function waitsForRenderDiagram(url) {

      var element = $("<div></div>").attr("id", "canvas-" + i++).appendTo("body");
      canvas = element.get(0);
      diagram = null;

      new Bpmn().renderUrl(url, { diagramElement : canvas.id }).then(function (d) {
        diagram = d;
      });

      waitsFor(function() {
        return diagram;
      }, "Rendering never completed", 10000);
    }

    it('should render all task types', function() {

      waitsForRenderDiagram("resources/task_types.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        // there should be 9 rect task shapes
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(9);
      });

    });

    it('should render a call activity', function() {
      waitsForRenderDiagram("resources/call_activity.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(1);
      });
    });

    it('should render a subprocess', function() {
      waitsForRenderDiagram("resources/subprocess_event.bpmn");

      runs(function () {
        expect(helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "meal preparations" }).length).toBe(1);
        expect(helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "provide meal" }).length).toBe(1);
      });

    });

    it('should wordwrap labels', function() {
      waitsForRenderDiagram("resources/test-wordwrap.bpmn");

      runs(function () {
        expect(helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "dadadadadada" }).length).toBe(3);
        expect(helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "dadadadbatman" }).length).toBe(1);
      });

    });

    it('should render all events', function() {
      waitsForRenderDiagram("resources/events.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "circle").length).toBe(41);
      });
    });

    it('should render basic event types', function() {
      waitsForRenderDiagram("resources/event-based-events.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "circle").length).toBe(12);
      });
    });

    it('should render activity markers', function() {
      waitsForRenderDiagram("resources/markers.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        // should render all marker paths
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path").length).toBe(9);
      });
    });

    it('should render transactions', function() {
      waitsForRenderDiagram("resources/transaction-subprocess.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        // 4 transactions with inner rects
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(8);
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "circle").length).toBe(7);
        // all paths including multiinstance
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path").length).toBe(13);
      });
    });

    it('should render groups', function() {

      waitsForRenderDiagram("resources/group.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        // task and group
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(2);

        var label = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, {"type" : "text", "text": "The Group"});
        expect(label.length).toBe(1);
      });

    });

    it('should render labels correctly', function() {

      waitsForRenderDiagram("resources/test-labels-basic.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        var labels = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "text");
        expect(labels.length).toBe(3);

        // label padding is included
        expect([labels[2]]).toHavePositions([{x : 535, y: 302}]);
      });

    });

    it('should render labels in collaboration correctly', function() {
      waitsForRenderDiagram("resources/test-labels-collaboration.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        var label = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, {"type" : "text", "text": "review"});
        expect(label.length).toBe(1);
        // gateway has label position
        expect(label).toHavePositions([{x : 658, y: 119}]);
      });
    });

    it('should render all boundary events', function() {
      waitsForRenderDiagram("resources/boundary_events.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "circle").length).toBe(34);
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(17);
      });
    });

    it('should not render non-existing label on pools / lanes', function() {

      waitsForRenderDiagram("resources/collaboration-empty-label.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        // there should be 9 rect task shapes
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "text").length).toBe(0);
      });
    });

    it('should render boundary event in front of task', function() {

      waitsForRenderDiagram("resources/boundary-behind-task.bpmn");

      runs(function () {
        var task = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect")[0];
        var boundary = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "circle")[0];

        var taskOverlay = $("#Task_ASDF", canvas);
        var boundaryOverlay = taskOverlay.nextAll("#BoundaryEvent_ASDF");

        expect(taskOverlay.length).toBe(1);
        expect(boundaryOverlay.length).toBe(1);
      });
    });

    it('should render collapsed pool', function() {

      waitsForRenderDiagram("resources/collapsed-pool.bpmn");

      runs(function () {
        var pool = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect")[0];
        var poolLabel = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "text")[0];

        expect(pool).toBeDefined();
        expect(poolLabel).toBeDefined();
      });
    });


    it('should render directed association with arrow', function() {

      waitsForRenderDiagram("resources/directed-association.bpmn");

      runs(function () {
        var paths = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path");

        // two associations + dataobject edge
        expect(paths.length).toBe(3);
      });
    });

    it('should render data objects', function() {

      waitsForRenderDiagram("resources/data-object.bpmn");

      runs(function () {
        var objects = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path");
        var lines = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "polyline");
        var texts = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "I AM DATA" });

        // two objects + arrow path
        expect(objects.length).toBe(3);

        // on text
        expect(texts.length).toBe(1);

        // one association
        expect(lines.length).toBe(1);
      });
    });

    it('should render message flow', function() {

      waitsForRenderDiagram("resources/collaboration-message-flow.bpmn");

      runs(function () {
        var paths = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path");

        // message flow
        expect(paths.length).toBe(1);
      });
    });

    it('should render message flow with message attached', function() {
      waitsForRenderDiagram("resources/collaboration-message-flow-message.bpmn");

      runs(function () {
        var paths = helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path");
        var texts = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "My Message" });

        // 2x (message flow + message)
        expect(paths.length).toBe(4);

        // text exists
        expect(texts.length).toBe(1);

        var greyFills = helper.findChildren(diagram.definitionRenderer.gfxGroup, {type : "path"}, "fillStyle", {r: 204, g: 204,b: 204});
        var whiteFills = helper.findChildren(diagram.definitionRenderer.gfxGroup, {type: "path"}, "fillStyle", {r: 255, g: 255,b: 255});

        // the message only
        expect(greyFills.length).toBe(1);
        // arrowheads and message path
        expect(whiteFills.length).toBe(3);
      });
    });

    it('should wrap long pool names', function() {
      waitsForRenderDiagram("resources/wrap-poolname.bpmn");

      runs(function () {
        var texts = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "Really Long Pooooooooooooooooo" });

        // wrapped text exists
        expect(texts.length).toBe(1);
      });
    });

    it('should render complex test', function() {

      waitsForRenderDiagram("resources/complex.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        // there should be 9 rect task shapes
        // expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(9);
      });

    });

    it('should render complex test (waitstates, subprocesses)', function() {
      waitsForRenderDiagram("resources/complex-waitstates-subprocesses.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        // there should be 9 rect task shapes
        // expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(9);
      });

    });

    xit('should render two tasks with boundary events on top of each other', function() {
      waitsForRenderDiagram("resources/BoundaryEventStack.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        // there should be 9 rect task shapes
        // expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(9);
      });
    });  
  });
});