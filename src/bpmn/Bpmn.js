define(["bpmn/Transformer", "bpmn/Renderer", "dojo/request"], function (Transformer, Renderer, request) {
  return {
    renderUrl  : function (url, options) {
      var promise = request(url);
      var self = this;

      promise.then(
        function (bpmnXml) {
          self.render(bpmnXml, options);
        },
        function (error) {
          throw error;
        }
      );

      return promise;
    },

    render : function (bpmnXml, options) {
      var processDefinition = new Transformer().transform(bpmnXml);
      console.log(processDefinition);

      var definitionRenderer = new Renderer(processDefinition);
      definitionRenderer.render(options);
    }
  };
});