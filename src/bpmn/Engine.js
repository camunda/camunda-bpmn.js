define(["bpmn/Executor", "bpmn/Transformer"], function (Executor, Transformer) {
  return {
    startInstance : function (bpmnXml, variables, listeners) {
      var transformer = new Transformer();
      
      transformer.parseListeners.splice(0,transformer.parseListeners.length);

      var listenerWrapper = function (listener) {
        return function(activityDefinition) {
          if (listener.id) {
            if (activityDefinition.id == listener.id) {
              activityDefinition.listeners.push(listener);
            }
          }else {
            activityDefinition.listeners.push(listener);
          }         
        };
      };

      if (listeners) {
        for (var index in listeners) {
          var listener = listeners[index];
          transformer.parseListeners.push(listenerWrapper(listener));
        }
      }

      var processDefinition = transformer.transform(bpmnXml)[0];

      var execution = new CAM.ActivityExecution(processDefinition);
      execution.variables = variables ? variables : {};
      execution.start();

      return execution;
    }
  };
});