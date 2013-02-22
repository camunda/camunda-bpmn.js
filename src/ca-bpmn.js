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

var CAM = {};

/**
 * The core process engine.
 *
 */
(function(CAM) {

  var ExecutionException = (function () {

    function ExecutionException(message, activityExecution) {
      this.message = message;
      this.activityExecution = activityExecution;
      throw message;
    }

    return ExecutionException;
  })(); 

  /** 
   * the activity types to be used by the process engine.
   * An activity type realizes the process language specific 
   * behavior of an activity.
   * 
   */
  var activityTypes = { };

  var LISTENER_START = "start";
  var LISTENER_END = "end";
  var LISTENER_TAKE = "take";

  // static utility functions ////////////////////////////////////

  var getActivitiesByType = function(activityDefinition, typeId, recursive) {
    var baseElements = [];
    for (var i = 0; i < activityDefinition.baseElements.length; i++) { 
      var childActivity = activityDefinition.baseElements[i];
      if(!!childActivity.type && childActivity.type == typeId){
        baseElements.push(childActivity);
        if(recursive) {
          baseElements = baseElements.concat(getActivitiesByType(childActivity, typeId, recursive));
        }
      }        
    }
    return baseElements;
  };

  var getActivityById = function(activityDefinition, id) {
    for (var i = 0; i < activityDefinition.baseElements.length; i++) { 
      var chidActivity = activityDefinition.baseElements[i];
      if(!!chidActivity.id && chidActivity.id == id){
        return chidActivity;
      }        
    }
    return null;
  };

  var getActivityType = function(activityDefinition) {
    var typeId = activityDefinition.type;
    if(!!typeId) {
      return activityTypes[typeId];
    } else {
      return null;
    }      
  };

  var getSequenceFlows = function(activityDefinition, scopeActivity) {
    var result = [];
    if(!!activityDefinition.outgoing) {
      var outgoingSequenceFlowIds = activityDefinition.outgoing;
      
      for (var i = 0; i < outgoingSequenceFlowIds.length; i++) { 
        var sequenceFlowId = outgoingSequenceFlowIds[i];
        result.push(getActivityById(scopeActivity, sequenceFlowId));      
      }
    }

    return result;
  };


  ///////////////////////////////////////////////////////////////
  
  var ActivityExecution = (function () {

    // constructor
    function ActivityExecution(activityDefinition, parentExecution) { 

      if(!activityDefinition) {
        throw new ExecutionException("Activity definition cannot be null", this);
      }
          
      this.activityDefinition = activityDefinition;    
      // a list of child activity executions
      this.activityExecutions = [];
      // indicates whether the execution has been ended
      this.isEnded = false;
      // the parent execution
      this.parentExecution = parentExecution;   
      // the variables of this execution
      this.variables = {};  

      this.startDate = null; 
      this.endDate = null; 
    }

    ActivityExecution.prototype.bindVariableScope = function(scope) {
      if(!!this.parentExecution) {
        this.parentExecution.bindVariableScope(scope);
      }
      var variables = this.variables;
      for(var varName in variables) {
        scope[varName] = variables[varName];
      }
    }

    ActivityExecution.prototype.executeActivities = function(activities) {
      for (var i = 0; i < activities.length; i++) {
        this.executeActivity(activities[i]);        
      }; 
    };

    ActivityExecution.prototype.executeActivity = function(activity, sequenceFlow) {          
      var childExecutor = new ActivityExecution(activity, this);                 
      this.activityExecutions.push(childExecutor);
       if(!!sequenceFlow) {
        childExecutor.incomingSequenceFlowId = sequenceFlow.id; 
      }
      childExecutor.start();
    };

    ActivityExecution.prototype.invokeListeners = function(type, sequenceFlow) {      
      var listeners = this.activityDefinition.listeners;
      if(!!listeners) {
        for(var i = 0; i < listeners.length; i++) {
          var listener = listeners[i];
          if(!!listener[type]) {
            listener[type](this, sequenceFlow);
          }
        }
      }
    };
   
    ActivityExecution.prototype.start = function() {   
      this.startDate = new Date();

      // if the activity is async, we do not execute it right away 
      // but simpley return. Execution can be continued using the 
      // continue() function
      if(!!this.activityDefinition.asyncCallback) {
        this.activityDefinition.asyncCallback(this);
      } else {
        this.continue();
      }
    };

    ActivityExecution.prototype.continue = function() {
      // invoke listeners on activity start
      this.invokeListeners(LISTENER_START);      

      // execute activity type
      var activityType = getActivityType(this.activityDefinition);
      activityType.execute(this);      
    };

    ActivityExecution.prototype.end = function(notifyParent) {
      this.isEnded = true;
      this.endDate = new Date();

      // invoke listeners on activity end
      this.invokeListeners(LISTENER_END);      
      
      if(!!this.parentExecution) {
        // remove from parent
        var parent = this.parentExecution;
        // notify parent
        if(notifyParent) {
          parent.hasEnded(this);   
        }        
      }   
    };

    ActivityExecution.prototype.takeAll = function(sequenceFlows) {
      for(var i = 0; i < sequenceFlows.length; i++) {
        this.take(sequenceFlows[i]);
      }
    };

    ActivityExecution.prototype.take = function(sequenceFlow) {
      var toId = sequenceFlow.targetRef;
      var toActivity = getActivityById(this.parentExecution.activityDefinition, toId);
      if(!toActivity) {
        throw new ExecutionException("cannot find activity with id '"+toId+"'");
      }      
      // end this activity
      this.end(false);

      // invoke listeners on sequence flow take      
      this.invokeListeners(LISTENER_TAKE, sequenceFlow);     

      // have the parent execute the next activity
      this.parentExecution.executeActivity(toActivity, sequenceFlow);
    };

    ActivityExecution.prototype.signal = function() {
      if(this.isEnded) {
        throw new ExecutionException("cannot signal an ended activity instance", this);
      }
      var type = getActivityType(this.activityDefinition);      
      if(!!type.signal) {
        type.signal(this);
      } else {
        this.end();
      }
    };

    /**
     * called by the child activity executors when they are ended
     */
    ActivityExecution.prototype.hasEnded = function(activityExecution) {
      var allEnded = true;
      for(var i; i < this.activityExecutions.length; i++) {
        allEnded &= this.activityExecutions[i].isEnded;
      }

      if(allEnded) {
        var activityType = getActivityType(this.activityDefinition);
        if(!!activityType.allActivitiesEnded) {
          activityType.allActivitiesEnded(this);
        } else {
          this.end();
        }
      }
    };

    /**
     * an activity instance is a java script object that holds the state of an 
     * ActivityExecution. It can be regarded as the serialized representation
     * of an execution tree. 
     */
    ActivityExecution.prototype.getActivityInstance = function() {      
      var activityInstance = {
        "activityId" : this.activityDefinition.id,
        "isEnded" : this.isEnded,
        "startDate" : this.startDate,
        "endDate" : this.endDate,
      }
      if(this.activityExecutions.length > 0) {
        activityInstance["activities"] = [];
        for(var i = 0; i < this.activityExecutions.length; i++) {
          activityInstance.activities.push(this.activityExecutions[i].getActivityInstance());
        }  
      }      
      return activityInstance;
    };

    return ActivityExecution;
  })();


  // export public APIs 
  CAM.ActivityExecution = ActivityExecution;
  CAM.ExecutionException = ExecutionException;
  CAM.activityTypes = activityTypes;
  CAM.getActivitiesByType = getActivitiesByType;
  CAM.getActivityById = getActivityById;
  CAM.getActivityType = getActivityType;
  CAM.getSequenceFlows = getSequenceFlows;

  CAM.LISTENER_START = LISTENER_START;
  CAM.LISTENER_END = LISTENER_END;
  CAM.LISTENER_TAKE = LISTENER_TAKE;

})(CAM);


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

/**
 * The BPMN 2.0 activity type module.
 *
 * This module provides the BPMN 2.0 specific runtime behavior
 */
(function(CAM) {

  // variables & conditions //////////////////////////////////////////

  var VariableScope = (function () {

    function VariableScope(activityExecution) {
      activityExecution.bindVariableScope(this);      
    };

    VariableScope.prototype.evaluateCondition = function(condition) {            
      return eval(condition);
    };

    return VariableScope;
  })(); 

  function evaluateCondition(condition, activityExecution) {
    return new VariableScope(activityExecution).evaluateCondition(condition);    
  }

  // the default outgoing behavior for BPMN 2.0 activities //////////

  function leave(activityExecution) {

    // SEPC p.427 §13.2.1
    // Multiple outgoing Sequence Flows behaves as a parallel split. 
    // Multiple outgoing Sequence Flows with conditions behaves as an inclusive split. 
    // A mix of multiple outgoing Sequence Flows with and without conditions is considered as a combination of a parallel and an inclusive split
    
    var sequenceFlowsToTake = [];
    var availableSequenceFlows = CAM.getSequenceFlows(activityExecution.activityDefinition, 
                                                  activityExecution.parentExecution.activityDefinition);
    var defaultFlowId = activityExecution.activityDefinition.default;

    var defaultFlow = null;
    var noConditionalFlowActivated = true;    
    
    for(var i =0; i<availableSequenceFlows.length; i++) {
      var sequenceFlow = availableSequenceFlows[i];

      if(!!defaultFlowId && defaultFlowId == sequenceFlow.id) {
        defaultFlow = sequenceFlow;

      } else if(!sequenceFlow.condition) {
        sequenceFlowsToTake.push(sequenceFlow);
        
      } else if(evaluateCondition(sequenceFlow.condition, activityExecution)) {
        sequenceFlowsToTake.push(sequenceFlow);
        noConditionalFlowActivated = false;
      }
      
    }
    
    // the default flow is only activated if all conditional flows are false
    if(noConditionalFlowActivated && !!defaultFlow) {
      sequenceFlowsToTake.push(defaultFlow);
    }
    
    activityExecution.takeAll(sequenceFlowsToTake);
  }

  // actual activity types //////////////////////////////////////////

  var process = {
    "execute" : function(activityExecution) {
  
      // find start events        
      var startEvents = CAM.getActivitiesByType(activityExecution.activityDefinition, "startEvent");
      
      if(startEvents.length == 0) {
        throw "process must have at least one start event";
      }
      
      // activate all start events
      activityExecution.executeActivities(startEvents);        
    }      
  };

  var startEvent = {
    "execute" : function(activityExecution) {
      leave(activityExecution);
    }
  };

  var intermediateThrowEvent = {
    "execute" : function(activityExecution) {
      leave(activityExecution);
    }
  };

  var endEvent = {
    "execute" : function(activityExecution) {
      activityExecution.end(true);
    }
  };

  var task = {
    "execute" : function(activityExecution) {
      leave(activityExecution);
    }
  };

  var userTask = {
    "execute" : function(activityExecution) {
      // wait state
    },
    "signal" : function(activityExecution) {
      leave(activityExecution);
    }
  };

  /**
   * implementation of the exclusive gateway
   */
  var exclusiveGateway = {
    "execute" : function(activityExecution) {
      var outgoingSequenceFlows = activityExecution.activityDefinition.sequenceFlows;

      var sequenceFlowToTake,
        defaultFlow;

      for(var i = 0; i<outgoingSequenceFlows.length; i++) {
        var sequenceFlow = outgoingSequenceFlows[i];
        if(!sequenceFlow.condition) {
          // we make sure at deploy time that there is only a single sequence flow without a condition
          defaultFlow = sequenceFlow;          
        } else if(evaluateCondition(sequenceFlow.condition, activityExecution)) {
          sequenceFlowToTake = sequenceFlow;
          break;
        }
      }

      if(!sequenceFlowToTake) {
        if(!defaultFlow) {
          throw "Cannot determine outgoing sequence flow for exclusive gateway '"+activityExecution.activityDefinition+"': " +
            "All conditions evaluate to false and a default sequence flow has not been specified."
        } else {
          sequenceFlowToTake = defaultFlow;
        }
      }

      activityExecution.take(sequenceFlowToTake);
    }
  };

  /**
   * implementation of the parallel gateway
   */
  var parallelGateway = {
    "execute" : function(activityExecution) {
      var outgoingSequenceFlows = CAM.getSequenceFlows(activityExecution.activityDefinition, 
                                                   activityExecution.parentExecution.activityDefinition);

      // join 
      var executionsToJoin = [];      
      var parent = activityExecution.parentExecution;
      for(var i=0; i<parent.activityExecutions.length; i++) {
        var sibling = parent.activityExecutions[i];
        if(sibling.activityDefinition == activityExecution.activityDefinition && !sibling.isEnded) {
          executionsToJoin.push(sibling);
        }
      }

      if(executionsToJoin.length == activityExecution.activityDefinition.cardinality) {
        // end all joined executions but this one,
        for(var i=0; i<executionsToJoin.length; i++) {
          var joinedExecution = executionsToJoin[i];
          if(joinedExecution != activityExecution) {
            joinedExecution.end(false);
          }
        }
        // continue with this execution
        activityExecution.takeAll(outgoingSequenceFlows);  
      }

    }
  };

  // register activity types
  CAM.activityTypes["startEvent"] = startEvent;
  CAM.activityTypes["intermediateThrowEvent"] = intermediateThrowEvent;
  CAM.activityTypes["endEvent"] = endEvent;
  CAM.activityTypes["exclusiveGateway"] = exclusiveGateway;
  CAM.activityTypes["task"] = task;
  CAM.activityTypes["userTask"] = userTask;
  CAM.activityTypes["process"] = process; 
  CAM.activityTypes["parallelGateway"] = parallelGateway;

})(CAM);

/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

/**
 * The BPMN 2.0 transformer module
 * 
 * This module provides the functionality necessary to transform 
 * a BPMN 2.0 XML file into a set of ActivityDefinitions that can be consumed 
 * by the process engine.
 */
(function(CAM){

  // XML namespaces
  var NS_BPMN_SEMANTIC = "http://www.omg.org/spec/BPMN/20100524/MODEL";
  var NS_BPMN_DIAGRAM_INTERCHANGE = "http://www.omg.org/spec/BPMN/20100524/DI";
  var NS_OMG_DC = "http://www.omg.org/spec/DD/20100524/DC";
  var NS_OMG_DI = "http://www.omg.org/spec/DD/20100524/DI";

  /** the parse listeners are callbacks that are invoked by the transformer 
    * when activity definitions are created */
  var parseListeners = [];

  function getXmlObject(source) {
    // use the browser's DOM implemenation
    var xmlDoc;
    if (window.DOMParser) {
      var parser = new DOMParser();
      xmlDoc = parser.parseFromString(source,"text/xml");
    } else {
      xmlDoc = new ActiveXObject("Microsoft.XMLDOM");
      xmlDoc.async=false;
      xmlDoc.loadXML(source); 
    }
    return xmlDoc;
  }

  var transform = function(source) {

    var doc = getXmlObject(source);    
    var definitions = doc.getElementsByTagName("definitions");

    if(definitions.length == 0) {
      throw "A BPMN 2.0 XML file must contain at least one definitions element";
    }

    // the generated Elements
    var generatedElements = [];
    var isExecutable = false;
    var lastGeneratedId = 0;

    function createBpmnObject(element, scope, bpmnDiElementIndex) {

      var bpmnObject = {};

      if(!!scope) {
        // add it to the parent activity definition
        scope.baseElements.push(bpmnObject);
      }

      var attributes = element.attributes;

      // set the type
      bpmnObject.type = element.tagName;

      // copy all attributes from the xml element to the json object
      for(var i = 0; i < attributes.length; i++) {
        var attribute = attributes[i];
        bpmnObject[attribute.nodeName] = attribute.nodeValue;
      }

      var bpmnDiObject = bpmnDiElementIndex[bpmnObject.id];
      if(!!bpmnDiObject) {
        bpmnObject.bpmndi = bpmnDiObject;
      } 

      // generate ID if not present:
      if(!bpmnObject.id) {
        bpmnObject.id = bpmnObject.type + "_" + lastGeneratedId;
        lastGeneratedId++;
      }
      
      return bpmnObject;

    }

    /** creates an ActivityDefinition and adds it to the scope activity. 
     * 'element' is a DOMElement
     * 'scope' is an ActivityDefinition
     */
    function createFlowElement(element, scope, sequenceFlows, bpmnDiElementIndex) {
      // the ActivityDefinition to be built      

      var bpmnObject = createBpmnObject(element, scope, bpmnDiElementIndex);

      bpmnObject.outgoing = [];
      bpmnObject.listeners = [];

      var attributes = element.attributes;

      // set and validate sequenceFlows
      if(!!sequenceFlows) {        
        var outgoingFlows = sequenceFlows[bpmnObject.id];                 
        if(!!outgoingFlows) {

          for(var i =0; i < outgoingFlows.length; i++) {
            bpmnObject.outgoing.push(outgoingFlows[i].id);
          }

          if(!!bpmnObject.default && isExecutable) { 

            var conditionalFlowFound = false;

            for(var i =0; i < outgoingFlows.length; i++) {
              var sequenceFlow = outgoingFlows[i];

              if(!!sequenceFlow.condition) {

                if(bpmnObject.defaultFlowId == sequenceFlow.id) {
                  throw "Sequence flow with id '" + sequenceFlow.id + "' is configured to be the default flow but has a condition";
                } else {
                  // if a default flow is configured, there needs to be at least one conditional flow:
                  conditionalFlowFound = true;
                }
              }
            }  

            if(!conditionalFlowFound) {
                throw "Activity with id '"+bpmnObject.id+"' declares default flow with id '" + bpmnObject.default + "' but has no conditional flows.";
            } 
          }  
        }
      }

      return bpmnObject;
    };

    function transformTask(element, scope, sequenceFlows, bpmnDiElementIndex) {
      // the ActivityDefinition to be built      

      var taskObject = createFlowElement(element, scope, sequenceFlows, bpmnDiElementIndex);
      return taskObject;
    };

    function transformEvent(element, scope, sequenceFlows, bpmnDiElementIndex) {
      // the ActivityDefinition to be built      

      var eventObject = createFlowElement(element, scope, sequenceFlows, bpmnDiElementIndex);
      eventObject.eventDefinitions = [];

      var child = element.firstChild;
      if(!!child) {
        do {
          if(child.nodeName == "messageEventDefinition") {
            eventObject.eventDefinitions.push({
              type : child.nodeName
            });
          }
        } while(child = child.nextSibling);
      }

      return eventObject;
    };

    function createSequenceFlow(element, scopeActivity, bpmnDiElementIndex, index) {

      var sequenceFlow = createBpmnObject(element, scopeActivity, bpmnDiElementIndex);
    
      if(!!sequenceFlow.sourceRef) {
        // add to the index
        if(!index[sequenceFlow.sourceRef]) {
          index[sequenceFlow.sourceRef] = [];
        }
        index[sequenceFlow.sourceRef].push(sequenceFlow);
      }
           
      // extract conditions:
      var conditions = element.getElementsByTagName("conditionExpression");
      if(!!conditions && conditions.length >0) {
        var condition = conditions[0];
        sequenceFlow.condition = condition.textContent;            
      }

      sequenceFlow.properties = {};
    
      return sequenceFlow;
    }

    /** loops over all <sequenceFlow .. /> elements and builds up a map of SequenceFlows
     */
    function createSequenceFlows(element, scopeActivity, bpmnDiElementIndex) {
      element = element.firstChild;
      var index = {};

      do {
        
        if(element.nodeName == "sequenceFlow" || element.localName == "sequenceFlow") {
          createSequenceFlow(element, scopeActivity, bpmnDiElementIndex, index);
        }

      } while(element = element.nextSibling);

      return index;
    };

    /** transform <parallelGateway ... /> elements */
    function transformParallelGateway(element, scopeActivity, sequenceFlows, bpmnDiElementIndex) {
      var bpmnObject = createFlowElement(element, scopeActivity, sequenceFlows, bpmnDiElementIndex);      

      // count incoming sequence flows
      var incomingFlows = 0;
      for (var prop in sequenceFlows) {
        var flows = sequenceFlows[prop];
        for(var i=0; i<flows.length; i++) {         
          if(flows[i].targetRef == bpmnObject.id) {
            incomingFlows++;
          }
        }
      }
      // set the number of sequenceFlows to be joined in the parallel gateway
      bpmnObject.cardinality = incomingFlows;

      return bpmnObject;
    };

    /** transform <exclusiveGateway ... /> elements */
    function transformExclusiveGateway(element, scopeActivity, sequenceFlows, bpmnDiElementIndex) {
      var bpmnObject = createFlowElement(element, scopeActivity, null, bpmnDiElementIndex);  
      var outgoingFlows = bpmnObject.sequenceFlows;
      var defaultFlowId = bpmnObject.default;

      // custom handling of sequence flows for exclusive GW:
      if(!!sequenceFlows && isExecutable) {
        var outgoingFlows = sequenceFlows[bpmnObject.id];
        if(!!outgoingFlows) {
          bpmnObject.sequenceFlows = outgoingFlows;
        }       
        if(!!outgoingFlows) {
          if(outgoingFlows.length == 1) {
            if(!!outgoingFlows[0].condition) {
              throw "If an exclusive Gateway has a single outgoing sequence flow, the sequence flow is not allowed to have a condition.";
            }
          } else if(outgoingFlows.length > 1) {
            for (var i = 0; i < outgoingFlows.length; i++) {
              var sequenceFlow = outgoingFlows[i];
            
              if (!!sequenceFlow.condition) {
                if (!!defaultFlowId && defaultFlowId == sequenceFlow.id) {
                  throw "Sequence flow with id '" + sequenceFlow.id + "' is configured to be the default flow but has a condition";
                }
                
              } else {
                if(defaultFlowId != sequenceFlow.id) {        
                  throw "Sequence flow with id '" + sequenceFlow.id + "' has no conditions but it is not configured to be the default flow.";
                }
              }
            }            
          }
        }
      }
      return bpmnObject;
    };

    /** invokes all parse listeners */
    function invokeParseListeners(bpmnObject, element, scopeActivity, scopeElement) {      
      for(var i=0; i<parseListeners.length; i++) {
        var parseListener = parseListeners[i];       
        parseListener(bpmnObject, element, scopeActivity, scopeElement);
      }
    }

    /** transforms all activites inside a scope into ActivityDefinitions */
    function transformScope(scopeElement, scopeActivity, bpmnDiElementIndex) {

      scopeActivity.baseElements = [];      

      // first, transform the sequenceflows
      var sequenceFlows = createSequenceFlows(scopeElement, scopeActivity, bpmnDiElementIndex);

      var element = scopeElement.firstChild;

      do {

        var bpmnObject = null;

        var elementType = element.nodeName;

        var taskElementTypes = ["task", "manualTask", "serviceTask", "scriptTask", "userTask", "sendTask", "recieveTask", "businessRuleTask"];
        var eventElementTypes = ["startEvent", "endEvent",  "intermediateThrowEvent", "intermediateCatchEvent", "boundaryEvent"];

        if(elementType == "exclusiveGateway") {
          bpmnObject = transformExclusiveGateway(element, scopeActivity, sequenceFlows, bpmnDiElementIndex);

        } else if(elementType == "parallelGateway") {
          bpmnObject = transformParallelGateway(element, scopeActivity, sequenceFlows, bpmnDiElementIndex);

        } else if(taskElementTypes.indexOf(elementType) != -1) {
          bpmnObject = transformTask(element, scopeActivity, sequenceFlows, bpmnDiElementIndex);
        
        } else if(eventElementTypes.indexOf(elementType) != -1) {
          bpmnObject = transformEvent(element, scopeActivity, sequenceFlows, bpmnDiElementIndex);

        } else if(!!element && element.nodeName != "sequenceFlow") {
          bpmnObject = createBpmnObject(element, scopeActivity, bpmnDiElementIndex);          
  
        }       

        if(!!bpmnObject) {
          invokeParseListeners(bpmnObject, element, scopeActivity, scopeElement);
        }

      } while(element = element.nextSibling);
    };

    /** transforms a <process ... /> element into the corresponding Javascript Object */
    function transformProcess(processElement, bpmnDiElementIndex) {     

      var bpmnObject = createFlowElement(processElement, null, null, bpmnDiElementIndex);
      
      if(!!bpmnObject.isExecutable) {      
        isExecutable = bpmnObject.isExecutable=="true";
      } else {
        isExecutable = false;
      }
      
      // transform a scope
      transformScope(processElement, bpmnObject, bpmnDiElementIndex);   

      generatedElements.push(bpmnObject);   

      invokeParseListeners(bpmnObject, processElement);
    };

    function transformDiElementToObject(element, object) {
      var properties = {};

      properties["type"] = element.localName;
      for(var i=0; i<element.attributes.length; i++) {
        var attribute = element.attributes.item(i);
        if(attribute.nodeName != "bpmnElement") {
          properties[attribute.nodeName] = attribute.nodeValue;
        }
      }      

      var childObjects = [];      
      var childElement = element.firstChild;
      if(!!childElement) {
        do{    
          transformDiElementToObject(childElement, childObjects);
        } while(childElement = childElement.nextSibling);
      }
      if(childObjects.length > 0) {
        properties['children'] = childObjects;
      }

      object.push(properties);
    }

    function createBpmnDiElementIndex(bpmnDiElement, bpmnDiElementIndex) {
      var bpmnElement;
      if(!!bpmnDiElement.namespaceURI && bpmnDiElement.namespaceURI == NS_BPMN_DIAGRAM_INTERCHANGE) {
          bpmnElement = bpmnDiElement.getAttribute("bpmnElement");                  
      }

      var element = bpmnDiElement.firstChild;
      if(!!element) {
        do {        
          if(bpmnDiElement.localName == "BPMNDiagram" || bpmnDiElement.localName ==  "BPMNPlane") {
            createBpmnDiElementIndex(element, bpmnDiElementIndex);            
          } else {
            var diElements = [];              

            transformDiElementToObject(bpmnDiElement, diElements);

            bpmnDiElementIndex[bpmnElement] = diElements;
          }
        } while(element = element.nextSibling);
      }
    }

    /** transforms a <definitions ... /> element into a set of activity definitions */
    function transformDefinitions(definitionsElement) {

      // first, we walk the DI and index DI elements by their "bpmnElement"-id references.
      // this allows us to walk the semantic part second and for each element in the semantic-part 
      // efficiently retreive the corresponding DI element
      var bpmnDiagrams = definitionsElement.getElementsByTagNameNS(NS_BPMN_DIAGRAM_INTERCHANGE, "BPMNDiagram");
      
      var bpmnDiElementIndex = {};
      for(var i=0; i < bpmnDiagrams.length; i++) {
        createBpmnDiElementIndex(bpmnDiagrams[i], bpmnDiElementIndex);
      }

      var processes = definitionsElement.getElementsByTagName("process");
      for(var i =0; i <processes.length; i++) {
        transformProcess(processes[i], bpmnDiElementIndex);
      }
    };

    transformDefinitions(definitions[0]);

    return generatedElements;
  };

  // expose public API
  CAM.transform = transform;
  CAM.parseListeners = parseListeners;

})(CAM);


/////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////

/**
 * The BPMN 2.0 SVG renderer module
 * 
 * This module provides the functionality for rendering a BPMN 2.0 Process Model in SVG
 */
(function(CAM) {

  var eventDefinitionPaths = {
    "messageCatch":" M7 10  L7 20  L23 20  L23 10  z M7 10  L15 16  L23 10 ",
    "messageThrow":"M7 9  L15 15  L23 9  z M7 10  L7 20  L23 20  L23 10  L15 16  z",
    "timer":" M15 5  L15 8  M20 6  L18.5 9  M24 10  L21 11.5  M25 15  L22 15  M24 20  L21 18.5  M20 24  L18.5 21  M15 25  L15 22  M10 24  L11.5 21  M6 20  L9 18.5  M5 15  L8 15  M6 10  L9 11.5  M10 6  L11.5 9  M17 8  L15 15  L19 15 ",
    "error": " M21.820839 10.171502  L18.36734 23.58992  L12.541380000000002 13.281818999999999  L8.338651200000001 19.071607  L12.048949000000002 5.832305699999999  L17.996148000000005 15.132659  L21.820839 10.171502  z",
    "escalation": "M15 7.75  L21 22.75  L15 16  L9 22.75  z",
    "signal": "M7.7124971 20.247342  L22.333334 20.247342  L15.022915000000001 7.575951200000001  L7.7124971 20.247342  z",
    "cancel": " M6.283910500000001 9.27369  L9.151395 6.4062062  L14.886362000000002 12.141174  L20.621331 6.4062056  L23.488814 9.273689  L17.753846 15.008657  L23.488815 20.743626  L20.621331 23.611111  L14.886362000000002 17.876142  L9.151394 23.611109  L6.283911000000001 20.743625  L12.018878 15.008658  L6.283910500000001 9.27369  z",
    "conditional": " M6 6  L24 6 L24 24 L6 24 L6 6 M9 9  L21 9  M9 13  L21 13  M9 17  L21 17  M9 21  L21 21 z",
    "compensate": "M14 8 L14 22 L7 15 L14 8 M21 8 L21 22 L14 15 L21 8 z",
    "multipleParallel": "M5.75 12  L5.75 18  L12 18  L12 24.75  L18 24.75  L18 18  L24.75 18  L24.75 12  L18 12  L18 5.75  L12 5.75  L12 12  z",
    "multiple": " M19.834856 21.874369  L9.762008 21.873529  L6.650126 12.293421000000002  L14.799725 6.373429600000001  L22.948336 12.294781  L19.834856 21.874369  z",
    "link": "M9 13 L18 13 L18 10 L23 15 L18 20 L18 17 L8 17 L8 13"
  }
        
  var taskDefinitionPaths = {
    // Public Domain: http://thenounproject.com/noun/user/#icon-No1331
    "user": "M60.541,28.82c0.532,2.353,1.176,4.893,1.301,7.342c0.033,0.654,0.072,1.512-0.201,2.07  c2.227,1.482,1.137,4.562-0.166,6.129c-0.469,0.562-1.535,1.26-1.773,1.957c-0.352,1.025-0.787,2.031-1.408,2.938  c-0.519,0.756-0.408,0.184-0.925,1.344c-0.35,1.576-0.881,5.145-0.13,6.61c0.986,1.921,3.146,3.137,4.934,4.159  c2.37,1.356,5.018,2.351,7.549,3.362c2.33,0.931,4.76,1.626,7.002,2.764c0.703,0.356,1.412,0.704,2.078,1.128  c0.537,0.342,1.438,0.869,1.566,1.559v5.424h-60.01l0.041-5.424c0.128-0.689,1.029-1.217,1.566-1.559  c0.666-0.424,1.375-0.771,2.078-1.128c2.242-1.138,4.673-1.833,7.002-2.764c2.531-1.012,5.178-2.006,7.549-3.362  c1.787-1.022,3.947-2.238,4.933-4.159c0.752-1.466,0.332-5.05-0.019-6.624l0,0c-0.601-0.389-1.016-1.594-1.357-2.197  c-0.359-0.637-0.648-1.324-1.086-1.914c-0.597-0.805-1.592-1.182-2.242-1.936c-0.434-0.502-0.619-1.124-0.834-1.74  c-0.257-0.736-0.131-1.334-0.246-2.161c-0.051-0.354,0.13-0.765,0.34-1.064c0.258-0.368,0.728-0.44,0.847-0.906  c0.147-0.577-0.177-1.253-0.239-1.823c-0.066-0.609-0.224-1.58-0.221-2.191c0.01-2.217-0.4-4.217,1.375-5.969  c0.624-0.614,1.333-1.145,2.01-1.699l0,0c0.26-0.828,1.507-1.338,2.236-1.616c0.947-0.36,1.943-0.562,2.914-0.851  c2.93-0.873,6.297-0.78,8.866,1.029c0.843,0.594,2.005,0.084,2.893,0.594C59.619,26.634,60.639,27.771,60.541,28.82z",
    // Public Domain: http://thenounproject.com/noun/gear/#icon-No1329
    "service": "M95.784,59.057c1.867,0,3.604-1.514,3.858-3.364c0,0,0.357-2.6,0.357-5.692c0-3.092-0.357-5.692-0.357-5.692  c-0.255-1.851-1.991-3.364-3.858-3.364h-9.648c-1.868,0-3.808-1.191-4.31-2.646s-1.193-6.123,0.128-7.443l6.82-6.82  c1.32-1.321,1.422-3.575,0.226-5.01L80.976,11c-1.435-1.197-3.688-1.095-5.01,0.226l-6.82,6.82c-1.32,1.321-3.521,1.853-4.888,1.183  c-1.368-0.67-5.201-3.496-5.201-5.364V4.217c0-1.868-1.514-3.604-3.364-3.859c0,0-2.6-0.358-5.692-0.358s-5.692,0.358-5.692,0.358  c-1.851,0.254-3.365,1.991-3.365,3.859v9.648c0,1.868-1.19,3.807-2.646,4.31c-1.456,0.502-6.123,1.193-7.444-0.128l-6.82-6.82  C22.713,9.906,20.459,9.804,19.025,11L11,19.025c-1.197,1.435-1.095,3.689,0.226,5.01l6.819,6.82  c1.321,1.321,1.854,3.521,1.183,4.888s-3.496,5.201-5.364,5.201H4.217c-1.868,0-3.604,1.514-3.859,3.364c0,0-0.358,2.6-0.358,5.692  c0,3.093,0.358,5.692,0.358,5.692c0.254,1.851,1.991,3.364,3.859,3.364h9.648c1.868,0,3.807,1.19,4.309,2.646  c0.502,1.455,1.193,6.122-0.128,7.443l-6.819,6.819c-1.321,1.321-1.423,3.575-0.226,5.01L19.025,89  c1.435,1.196,3.688,1.095,5.009-0.226l6.82-6.82c1.321-1.32,3.521-1.853,4.889-1.183c1.368,0.67,5.201,3.496,5.201,5.364v9.648  c0,1.867,1.514,3.604,3.365,3.858c0,0,2.599,0.357,5.692,0.357s5.692-0.357,5.692-0.357c1.851-0.255,3.364-1.991,3.364-3.858v-9.648  c0-1.868,1.19-3.808,2.646-4.31s6.123-1.192,7.444,0.128l6.819,6.82c1.321,1.32,3.575,1.422,5.01,0.226L89,80.976  c1.196-1.435,1.095-3.688-0.227-5.01l-6.819-6.819c-1.321-1.321-1.854-3.521-1.183-4.889c0.67-1.368,3.496-5.201,5.364-5.201H95.784  z M50,68.302c-10.108,0-18.302-8.193-18.302-18.302c0-10.107,8.194-18.302,18.302-18.302c10.108,0,18.302,8.194,18.302,18.302  C68.302,60.108,60.108,68.302,50,68.302z",
    "script": "M6.402,0.5h14.5c0,0-5.833,2.833-5.833,5.583s4.417,6,4.417,9.167    s-4.167,5.083-4.167,5.083H0.235c0,0,5-2.667,5-5s-4.583-6.75-4.583-9.25S6.402,0.5,6.402,0.5z"
  }

  var activityMarkerPaths = {
    "loop": "M 0 0 L 0 3 L -3 3 M 0 3 A 4.875,4.875 0 1 1 4 3",
    "miSeq": "M 0 -2 h10 M 0 2 h10 M 0 6 h10",
    "miPar": "M 0 -2 v8 M 4 -2 v8 M 8 -2 v8",
    "adhoc": "m 0 0 c -0.54305,0.60192 -1.04853,1.0324 -1.51647,1.29142 -0.46216,0.25908 -0.94744,0.38857 -1.4558,0.38857 -0.57194,0 -1.23628,-0.22473 -1.99307,-0.67428 -0.0577,-0.0306 -0.10111,-0.0534 -0.12999,-0.0687 -0.0346,-0.0228 -0.0896,-0.0533 -0.16464,-0.0915 -0.80878,-0.47234 -1.4558,-0.70857 -1.94107,-0.70857 -0.46217,0 -0.91566,0.14858 -1.36047,0.44576 -0.44485,0.2895 -0.92434,0.75046 -1.43849,1.38285 l 0,-2.03429 c 0.54881,-0.60194 1.05431,-1.0324 1.51647,-1.29147 0.46793,-0.26666 0.9532,-0.39999 1.45581,-0.39999 0.57191,0 1.24205,0.22856 2.01039,0.68574 0.0461,0.0308 0.0838,0.0533 0.11266,0.0687 0.0404,0.0228 0.0982,0.0533 0.1733,0.0913 0.803,0.4724 1.45002,0.70861 1.94108,0.70857 0.44481,4e-5 0.88676,-0.14475 1.32581,-0.43429 0.43905,-0.2895 0.9272,-0.75425 1.46448,-1.39428",
    "compensate": "M 50 70 L 55 65 L 55 75z M44.7 70 L49.7 75 L 49.7 65z"
  }
        
  var regularStroke = "grey";
  var highlightStroke = "darkOrange";

  var generalStyle = {
    stroke: regularStroke,
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-opacity" : 1
  }

  var groupStyle = {
    stroke: regularStroke,
    "stroke-width": 2,
    "stroke-opacity" : 1
  }

  var dataObjectStyle = {
    stroke: regularStroke,
    "stroke-width": 2,
    "stroke-opacity" : 1
  }

  var eventStyle = {
    "stroke-width": 1.5,
    "fill": "white"
  };

  var endEventStyle = {
    "stroke-width": 3,
  };

  var activityStyle = {
    stroke: regularStroke,
    "stroke-width": 2,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-opacity" : 1,
    "fill": "white"
  };

  var gatewayStyle = {
    "fill": "white"
  };
    
  var gatewayMarkerStyle = {
    stroke: regularStroke,
    "stroke-opacity" : 1,
    "stroke-width": 4
  };
   
  var sequenceFlowStyle = {
    "stroke-width": 2,
    "arrow-end": "block-midium-midium",
    "stroke-linecap": "square",
    "stroke-linejoin": "round"  
  };

  var messageFlowStyle = {
    "stroke-width": 2,
    "arrow-end": "open-wide-long",
    "stroke-dasharray": "-",
    "stroke-linecap": "round",
    "stroke-linejoin": "round"  
  };

    
  var textStyle = {
    "font-size": 12, 
    "font-family": "Arial, Helvetica, sans-serif",
  };

  var textBigStyle = {
    "font-size": 20, 
    "font-family": "Arial, Helvetica, sans-serif",
  }

  var processRenderer = {
    render : function(elementRenderer) {
      // nothing to do
    }
  };

  var startEventRenderer = {
    render : function(elementRenderer) {

      var bounds = elementRenderer.getBounds();
      var x = bounds.x;
      var y = bounds.y;
      var rad = bounds.width / 2;

      // render basic circle
      var svgElement = elementRenderer.canvas.circle(x, y, rad)
        .attr(generalStyle)
        .attr(eventStyle);

      var element = elementRenderer.baseElement;

      // mark as non-interrupting if necessary
      if (element.cancelActivity == false) {
        drawnElement.attr({"stroke-dasharray": "-"})
      }   
      
    /**
    // message?
    if (element.eventType == "message") {
      // catch?
      if ((element.type.toLowerCase().indexOf("catch") >= 0)|| (element.type.toLowerCase().indexOf("boundary") >= 0) || (element.type.toLowerCase().indexOf("start") >= 0)) {
        
      } else {
        var myPathSpec = eventDefinitions["messageThrow"];
        var myPath = paper.path(myPathSpec).attr(generalStyle).attr({"stroke":"none", "fill":regularStroke});
        myPath.translate(x - rad, y-rad);
      }
    // timer?
    } else if (element.eventType == "timer") {
      paper.circle(x, y, 10).attr(generalStyle).attr(eventStyle);
      var myPathSpec = eventDefinitions[element.eventType];
      var myPath = paper.path(myPathSpec).attr(generalStyle).attr(eventStyle);
      myPath.translate(x - rad, y-rad);
    // terminate?
    } else if (element.eventType == "terminate") {
      paper.circle(x, y, 8).attr(generalStyle).attr(eventStyle).attr({"fill":regularStroke});
    // cancel?
    } else if (element.eventType == "cancel") {
      var myPathSpec = eventDefinitions[element.eventType];
      var myPath = paper.path(myPathSpec).attr(generalStyle).attr(eventStyle);
      myPath.translate(x - rad, y-rad);
      // throwing?
      if ((element.type.toLowerCase().indexOf("throw") >= 0) || element.type.toLowerCase().indexOf("end") >= 0){
        myPath.attr({"stroke":"none", "fill":regularStroke});
      }
    // sth. else?
    } else if ((element.eventType == "error") || (element.eventType == "multipleParallel") || (element.eventType == "multiple") || (element.eventType == "escalation") || (element.eventType == "link") || (element.eventType == "signal") || (element.eventType == "cancel") || (element.eventType == "conditional") || (element.eventType == "compensate")) {
      var myPathSpec = eventDefinitions[element.eventType];
      var myPath = paper.path(myPathSpec).attr(generalStyle).attr(eventStyle);
      myPath.translate(x - rad, y-rad);
      // throwing?
      if ((element.type.toLowerCase().indexOf("throw") >= 0) || element.type.toLowerCase().indexOf("end") >= 0){
        myPath.attr({"stroke":"none", "fill":regularStroke});
      }
    }

    if (element.name) { 
      if (element.labelX) {
        paper.text(element.labelX, element.labelY, element.name).attr(textStyle).attr({'text-anchor': 'start'});
      } else {
        paper.text(x, parseInt(y) + parseInt(element.height/2) + 15, element.name).attr(textStyle);
      }
    }
    **/
      return svgElement;

    }
  };

  // build up the map of renderers
  var RENDERER_DELEGATES = {};
  RENDERER_DELEGATES["process"] = processRenderer;
  RENDERER_DELEGATES["startEvent"] = startEventRenderer;

  var RenderingException = (function () {

    function RenderingException(message, bpmnElementRenderer) {
      this.message = message;
      this.bpmnElementRenderer = bpmnElementRenderer;
      throw message;
    }

    return RenderingException;
  })(); 


  /**
   * The BpmnElementRenderer class is responsible for rendering a base element
   */
  var BpmnElementRenderer = (function () {

    // constructor
    function BpmnElementRenderer(baseElement, parentRenderer) { 

      if(!baseElement) {
        throw new RenderingException("Base element cannot be null");
      }

      // the bpmn base element to be rendered          
      this.baseElement = baseElement;    

      // the parent renderer
      this.parentRenderer = parentRenderer;

      // the child renderers
      this.childRenderers = [];

      // add this renderer as a child renderer to the parent renderer
      if(!!parentRenderer) {
        this.canvas = parentRenderer.canvas;
        parentRenderer.childRenderers.push(this);

      } else {
        // create canvas
	// TODO: allow users to pass in a DOM Element
        this.htmlCanvas = document.createElement('canvas');
        this.canvas = Raphael(this.htmlCanvas, "100%");

      }

      // if the base element has child base elements, create the 
      // subordinate renderers
      if(!!baseElement.baseElements) {
        for(var i = 0; i < baseElement.baseElements.length; i++) {
          new BpmnElementRenderer(baseElement.baseElements[i], this);
        }
      }
      
    };

    BpmnElementRenderer.prototype.performLayout = function() {

      // first layout this renderer      
      var delegate = RENDERER_DELEGATES[this.baseElement.type];
      if(!!delegate) {
        this.svgElement = delegate.render(this);
      } else {
        throw new RenderingException("Unable to render element of type "+this.baseElement.type);
      }
      
      // now layout the subordinate renderers:
      for (var i = 0; i < this.childRenderers.length; i++) {        
        this.childRenderers[i].performLayout();
      };

    };

    BpmnElementRenderer.prototype.getBounds = function() {
      return this.baseElement.bpmndi[0].children[0];
    }



    return BpmnElementRenderer;

  })();

  // expose public API
  CAM.BpmnElementRenderer = BpmnElementRenderer;
  CAM.RENDERER_DELEGATES = RENDERER_DELEGATES; // exposing the renderer delegates allows people to customize the renderer

})(CAM);
