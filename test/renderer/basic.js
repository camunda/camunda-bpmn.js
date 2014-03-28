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

    function waitsForUrlProcessed(url, options) {

      var finished;

      var element = $("<div></div>").attr("id", "canvas-" + i++).appendTo("body");
      canvas = element.get(0);
      diagram = null;

      options = options || {};

      options.diagramElement = canvas.id;

      var promise = new Bpmn().renderUrl(url, options);

      promise.then(function (d) {
        finished = true;
        return d;
      }, function (error) {
        finished = true;
      });

      waitsFor(function() {
        return finished;
      }, "Processing finished", 10000);

      return promise;
    }

    function waitsForRenderDiagram(url) {
      var error = null;

      waitsForUrlProcessed(url).then(function (d) {
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

    it('should render call activities with different isExpanded attributes', function() {
      waitsForRenderDiagram("resources/callActivity_marker.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(3);
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path").length).toBe(2);
      });   
    });   

    it('should render sub Processes with different isExpanded attributes', function() {
      waitsForRenderDiagram("resources/subProcess_marker.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(3);
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path").length).toBe(2);
      });   
    });    

    it('should render a subprocess', function() {
      waitsForRenderDiagram("resources/subprocess_event.bpmn");

      runs(function () {
        expect(helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "meal preparations" }).length).toBe(1);
        expect(helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "provide meal" }).length).toBe(1);
      });

    });

     it('should render transactions with different isExpanded attributes', function() {
      waitsForRenderDiagram("resources/transaction_marker.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(6);
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path").length).toBe(2);
      });   
    }); 
    
    it('should render ad hoc sub Processes with different isExpanded attributes', function() {
      waitsForRenderDiagram("resources/adHoc_subProcess_marker.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "rect").length).toBe(3);
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path").length).toBe(5);
      });   
    }); 

    it('should wordwrap labels', function() {
      waitsForRenderDiagram("resources/test-wordwrap.bpmn");

      runs(function () {
        expect(helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "dadadadadadad" }).length).toBe(2);
        expect(helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "adadadadadada" }).length).toBe(1);
        expect(helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "adadbatman" }).length).toBe(1);
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
        expect(helper.findChildrenByType(diagram.definitionRenderer.gfxGroup, "path").length).toBe(9);
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
        expect([labels[2]]).toHavePositions([{x : 566.5, y: 312, align : 'middle'}]);
      });

    });

    it('should render labels in collaboration correctly', function() {
      waitsForRenderDiagram("resources/test-labels-collaboration.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        var label = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, {"type" : "text", "text": "review successful?"});
        expect(label).toBeDefined();
        // gateway has label position
        expect(label).toHavePositions([{x : 713, y: 129, align: 'middle'}]);
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

        var taskOverlay = diagram.getOverlay('Task_ASDF');
        var boundaryOverlay = taskOverlay.nextAll("div[data-activity-id=BoundaryEvent_ASDF]");

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
        var text1 = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "Really Long" });
        var text2 = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "Poooooooooooooooooooooooooo" });
        var text3 = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, { type: "text", text: "ooooooooooooooooolname" });

        // wrapped text exists
        expect(text1.length).toBe(1);
        expect(text2.length).toBe(1);
        expect(text3.length).toBe(1);
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

    it('should render an annotation element with bpmn2 namespace', function() {
      waitsForRenderDiagram("resources/process-with-annotation.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });    

    it('should render data input and data output wit bpmn2 namespace', function() {
      waitsForRenderDiagram("resources/process-with-data-input-and-data-output.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });       

    it('should render exclusive gateway without default sequence flow', function() {
      waitsForRenderDiagram("resources/exclusive-gateway-without-default-flow.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });   

    it('should render exclusive gateway with only one outgoing sequence flow, which is not the default flow', function() {
      waitsForRenderDiagram("resources/exclusive-gateway-with-only-one-outgoing-flow.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });

    it('should render exclusive gateway with one default flow and one outgoing condition sequence flow', function() {
      waitsForRenderDiagram("resources/exclusive-gateway-with-default-and-condition-flow.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });    

    it('should not render exclusive gateway with a default flow and with two other outgoingflows but without condition', function() {
      var finished, diagram, error,
          options = { executable : true };

      runs(function() {

        waitsForUrlProcessed("resources/exclusive-gateway-with-one-default-flow-and-two-flows-without-conditions.bpmn", options).then(

          function(dia) {
            finished = true;
            diagram = dia;
          },

          function(err) {
            finished = true;
            error = err;
          }

        );

      });

      waitsFor(function() {
        return !!finished;
      });

      runs(function() {
        expect(diagram).not.toBeDefined();

        expect(error).toBeDefined();
        expect(error).toBeError();
        expect(error.message).toBe("Exclusive Gateway 'ExclusiveGateway_1' has outgoing sequence flows without conditions which are not the default flow.")
      });
    });   

    it('should render exclusive gateway with a default flow and with two other outgoingflows but without condition', function() {
      var finished, diagram, error;

      runs(function() {

        waitsForUrlProcessed("resources/exclusive-gateway-with-one-default-flow-and-two-flows-without-conditions.bpmn").then(

          function(dia) {
            finished = true;
            diagram = dia;
          },

          function(err) {
            finished = true;
            error = err;
          }

        );

      });

      waitsFor(function() {
        return !!finished;
      });

      runs(function() {
        expect(diagram).toBeDefined();
        expect(error).not.toBeDefined();
      });
    }); 

    it('should not render exclusive gateway with outgoing sequence flows but without conditions and any default flow', function() {
      var finished, diagram, error,
          options = { executable : true };

      runs(function() {

        waitsForUrlProcessed("resources/exclusive-gateway-with-outgoing-flows-without-conditions.bpmn", options).then(

          function(dia) {
            finished = true;
            diagram = dia;
          },

          function(err) {
            finished = true;
            error = err;
          }

        );

      });

      waitsFor(function() {
        return !!finished;
      });

      runs(function() {
        expect(diagram).not.toBeDefined();

        expect(error).toBeDefined();
        expect(error).toBeError();
        expect(error.message).toBe("Exclusive Gateway 'ExclusiveGateway_1' has outgoing sequence flows without conditions which are not the default flow.")
      });

    });

    it('should render exclusive gateway with outgoing sequence flows but without conditions and any default flow', function() {
      var finished, diagram, error;

      runs(function() {

        waitsForUrlProcessed("resources/exclusive-gateway-with-outgoing-flows-without-conditions.bpmn").then(

          function(dia) {
            finished = true;
            diagram = dia;
          },

          function(err) {
            finished = true;
            error = err;
          }

        );

      });

      waitsFor(function() {
        return !!finished;
      });

      runs(function() {
        expect(diagram).toBeDefined();
        expect(error).not.toBeDefined();
      });

    });  

    it('should not render exclusive gateway with one outgoing sequence flow, which is the default flow and has a condition', function() {
      var finished, diagram, error,
          options = { executable : true };

      runs(function() {

        waitsForUrlProcessed("resources/exclusive-gateway-with-one-outgoing-flow.bpmn", options).then(

          function(dia) {
            finished = true;
            diagram = dia;
          },

          function(err) {
            finished = true;
            error = err;
          }

        );

      });

      waitsFor(function() {
        return !!finished;
      });

      runs(function() {
        expect(diagram).not.toBeDefined();

        expect(error).toBeDefined();
        expect(error).toBeError();
        expect(error.message).toBe("If an exclusive Gateway has a single outgoing sequence flow, the sequence flow is not allowed to have a condition.")
      });

    });     

    it('should render exclusive gateway with one outgoing sequence flow, which is the default flow and has a condition', function() {
      var finished, diagram, error;

      runs(function() {

        waitsForUrlProcessed("resources/exclusive-gateway-with-one-outgoing-flow.bpmn").then(

          function(dia) {
            finished = true;
            diagram = dia;
          },

          function(err) {
            finished = true;
            error = err;
          }

        );

      });

      waitsFor(function() {
        return !!finished;
      });

      runs(function() {
        expect(diagram).toBeDefined();
        expect(error).not.toBeDefined();
      });

    }); 

    it('should not render exclusive gateway with outgoing sequence flows, which one of them is the default flow and has a condition', function() {
      var finished, diagram, error,
          options = { executable : true };

      runs(function() {

        waitsForUrlProcessed("resources/exclusive-gateway-with-outgoing-flows.bpmn", options).then(

          function(dia) {
            finished = true;
            diagram = dia;
          },

          function(err) {
            finished = true;
            error = err;
          }

        );

      });

      waitsFor(function() {
        return !!finished;
      });

      runs(function() {
        expect(diagram).not.toBeDefined();

        expect(error).toBeDefined();
        expect(error).toBeError();
        expect(error.message).toBe("Sequence flow with id 'SequenceFlow_1' is configured to be the default flow but has a condition.")
      });

    });

    it('should render exclusive gateway with outgoing sequence flows, which one of them is the default flow and has a condition', function() {
      var finished, diagram, error;

      runs(function() {

        waitsForUrlProcessed("resources/exclusive-gateway-with-outgoing-flows.bpmn").then(

          function(dia) {
            finished = true;
            diagram = dia;
          },

          function(err) {
            finished = true;
            error = err;
          }

        );

      });

      waitsFor(function() {
        return !!finished;
      });

      runs(function() {
        expect(diagram).toBeDefined();
        expect(error).not.toBeDefined();
      });

    });

    it('should render task label with line break', function() {
      waitsForRenderDiagram("resources/task-label-with-line-break.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });       

    it('should render text annotations with line break', function() {
      waitsForRenderDiagram("resources/text-annotations-with-line-break.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });  

    it('should render data object reference', function() {
      waitsForRenderDiagram("resources/data-object-reference.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });  

    it('should render activities with periods in id', function() {
      waitsForRenderDiagram("resources/activities-with-periods.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();

        var startEventOverlay = diagram.getOverlay('start.event.1');
        var taskOverlay = diagram.getOverlay('task.1');
        var endEventOverlay = diagram.getOverlay('end.event.1');

        expect(startEventOverlay.length).toBe(1);
        expect(taskOverlay.length).toBe(1);
        expect(endEventOverlay.length).toBe(1);
      });

    });      

    it('should render miwg reference A.1.0', function() {
      waitsForRenderDiagram("resources/miwg-test-suite/A.1.0.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });  

    it('should render miwg reference A.2.0', function() {
      waitsForRenderDiagram("resources/miwg-test-suite/A.2.0.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });

    it('should render miwg reference A.3.0', function() {
      waitsForRenderDiagram("resources/miwg-test-suite/A.3.0.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });  

    it('should render miwg reference A.4.0', function() {
      waitsForRenderDiagram("resources/miwg-test-suite/A.4.0.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });  

    it('should render miwg reference A.4.1', function() {
      waitsForRenderDiagram("resources/miwg-test-suite/A.4.1.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });  

    it('should render miwg reference B.2.0', function() {
      waitsForRenderDiagram("resources/miwg-test-suite/B.2.0.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
      });

    });

    it('should render labels inside a task', function() {
      waitsForRenderDiagram("resources/labels.bpmn");

      runs(function () {
        expect(diagram.definitionRenderer).toBeDefined();
        var label = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, {"type" : "text", "text": "Post-Ident"});
        expect(label).toBeDefined();
        // gateway has label position
        expect(label).toHavePositions([{x : 358, y: 79, align: 'middle' }]);

        label = helper.findChildrenByProperties(diagram.definitionRenderer.gfxGroup, {"type" : "text", "text": "Assign Approver"});
        expect(label).toBeDefined();
        // gateway has label position
        expect(label).toHavePositions([{x : 746.75, y: 169, align: 'middle' }]);
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