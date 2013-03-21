define(["bpmn/Executor", "bpmn/Transformer"], function (Executor, Transformer) {
  return {
    startInstance : function (bpmnXml, variables, listeners) {
      var transformer = new Transformer();
      transformer.parseListeners = listeners;
      var processDefinition = transformer.transform(bpmnXml);

      var execution = new CAM.ActivityExecution(processDefinition);
      execution.variables = variables;
      execution.start();
    }
  };
});