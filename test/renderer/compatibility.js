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

  var canvas;
  var i = 0;

  beforeEach(function() {
    canvas = document.createElement("div");
    canvas.id = "canvas-" + i++;

    document.getElementsByTagName("body")[0].appendChild(canvas);
  });

  it('should render diagram with namespace prefix', function() {
    var rendered = false;

    var bpmn = new Bpmn();
    bpmn.renderUrl("resources/prefixed.bpmn", {
      diagramElement : canvas.id
    }).then(function (bpmn) {
        rendered = true;
    });

    waitsFor(function() {
      return rendered;
    }, "Rendering never completed", 10000);

    runs(function () {
      expect(bpmn.definitionRenderer).toBeDefined();
      // there should be 2 rect task shapes of the participants, and 2 for the lanes
      expect(helper.findChildrenByType(bpmn.definitionRenderer.gfxGroup, "rect").length).toBe(4);
    });

  });
});

});