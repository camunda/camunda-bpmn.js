"use strict";

define(["bpmn/Bpmn", "bpmn/Transformer", "test/util/TestHelper"], function(Bpmn, Transformer, helper) {

  return describe('Zoom', function() {

    it('should zoom collaboration with respect to all participant bounds', function() {
      afterEach(function () {

      });

      var rendered = false;

      var bpmn = new Bpmn();
      bpmn.renderUrl("resources/collaboration_zoom.bpmn", {
        diagramElement : "canvas",
        width : 100,
        height : 100
      }).then(function (bpmn) {
          rendered = true;
        });

      waitsFor(function() {
        return rendered;
      }, "Rendering never completed", 5000);

      runs(function () {
        expect(bpmn.definitionRenderer).toBeDefined();
        expect(bpmn.definitionRenderer.getSurface()).toBeDefined();

        expect(Math.ceil(bpmn.definitionRenderer.getSurface().getDimensions().width)).toBeCloseTo(100);
        expect(Math.ceil(bpmn.definitionRenderer.getSurface().getDimensions().height)).toBeCloseTo(55);
      });

    });
  });

});
