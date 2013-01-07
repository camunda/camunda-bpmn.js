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

  var getActivitiesByType = function(activityDefinition, typeId) {
    var activities = [];
    for (var i = 0; i < activityDefinition.activities.length; i++) { 
      var chidActivity = activityDefinition.activities[i];
      if(!!chidActivity.typeId && chidActivity.typeId == typeId){
        activities.push(chidActivity);
      }        
    }
    return activities;
  };

  var getActivityById = function(activityDefinition, id) {
    for (var i = 0; i < activityDefinition.activities.length; i++) { 
      var chidActivity = activityDefinition.activities[i];
      if(!!chidActivity.id && chidActivity.id == id){
        return chidActivity;
      }        
    }
    return null;
  };

  var getActivityType = function(activityDefinition) {
    var typeId = activityDefinition.typeId;
    if(!!typeId) {
      return activityTypes[typeId];
    } else {
      return null;
    }      
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

    ActivityExecution.prototype.executeActivity = function(activity) {      
      var childExecutor = new ActivityExecution(activity, this);                 
      this.activityExecutions.push(childExecutor);
      childExecutor.start();
    };

    ActivityExecution.prototype.invokeListeners = function(type, transition) {      
      var listeners = this.activityDefinition.listeners;
      if(!!listeners) {
        for(var i = 0; i < listeners.length; i++) {
          var listener = listeners[i];
          if(!!listener[type]) {
            listener[type](this, transition);
          }
        }
      }
    };
   
    ActivityExecution.prototype.start = function() {   
      this.startDate = new Date();

      // if the activity is async, we do not execute it right away 
      // but simpley return. Execution can be continued using the 
      // continue() function
      if(!!this.activityDefinition.properties.asyncCallback) {
        this.activityDefinition.properties.asyncCallback(this);
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

    ActivityExecution.prototype.takeAll = function(transitions) {
      for(var i = 0; i < transitions.length; i++) {
        this.take(transitions[i]);
      }
    };

    ActivityExecution.prototype.take = function(transition) {
      var toId = transition.to;
      var toActivity = getActivityById(this.parentExecution.activityDefinition, toId);
      if(!toActivity) {
        throw new ExecutionException("cannot find activity with id '"+toId+"'");
      }      
      // end this activity
      this.end(false);

      // invoke listeners on sequence flow take      
      this.invokeListeners(LISTENER_TAKE, transition);     

      // have the parent execute the next activity
      this.parentExecution.executeActivity(toActivity);
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
    
    var transitionsToTake = [];
    var availableTransitions = activityExecution.activityDefinition.transitions;
    var defaultFlowId = activityExecution.activityDefinition.properties.defaultFlowId;

    var defaultFlow = null;
    var noConditionalFlowActivated = true;    
    
    for(var i =0; i<availableTransitions.length; i++) {
      var transition = availableTransitions[i];

      if(!!defaultFlowId && defaultFlowId == transition.id) {
        defaultFlow = transition;

      } else if(!transition.condition) {
        transitionsToTake.push(transition);
        
      } else if(evaluateCondition(transition.condition, activityExecution)) {
        transitionsToTake.push(transition);
        noConditionalFlowActivated = false;
      }
      
    }
    
    // the default flow is only activated if all conditional flows are false
    if(noConditionalFlowActivated && !!defaultFlow) {
      transitionsToTake.push(defaultFlow);
    }
    
    activityExecution.takeAll(transitionsToTake);
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
      var outgoingTransitions = activityExecution.activityDefinition.transitions;

      var transitionToTake,
        defaultFlow;

      for(var i = 0; i<outgoingTransitions.length; i++) {
        var transition = outgoingTransitions[i];
        if(!transition.condition) {
          // we make sure at deploy time that there is only a single sequence flow without a condition
          defaultFlow = transition;          
        } else if(evaluateCondition(transition.condition, activityExecution)) {
          transitionToTake = transition;
          break;
        }
      }

      if(!transitionToTake) {
        if(!defaultFlow) {
          throw "Cannot determine outgoing sequence flow for exclusive gateway '"+activityExecution.activityDefinition+"': " +
            "All conditions evaluate to false and a default sequence flow has not been specified."
        } else {
          transitionToTake = defaultFlow;
        }
      }

      activityExecution.take(transitionToTake);
    }
  };

  /**
   * implementation of the parallel gateway
   */
  var parallelGateway = {
    "execute" : function(activityExecution) {
      var outgoingTransitions = activityExecution.activityDefinition.transitions;

      activityExecution.takeAll(outgoingTransitions);
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

    // the generated ActivityDefinitions
    var activityDefinitions = [];

    /** creates an ActivityDefinition and adds it to the scope activity. 
     * 'element' is a DOMElement
     * 'scope' is an ActivityDefinition
     */
    function createActivityDefinition(element, scope, sequenceFlows) {
      // the ActivityDefinition to be built      
      var activityDefinition = {
        "id" : "",
        "name" : "",
        "typeId" : "",
        "activities" : [],
        "transitions" : [],
        "properties" : [],
        "listeners" : []
      };

      if(!!scope) {
        // add it to the parent activity definition
        scope.activities.push(activityDefinition);
      }

      var attributes = element.attributes;

      // extract the 'id' property
      if(!attributes.id) {
        throw (element+" must have an id ");
      }
      activityDefinition.id = attributes.id.value;

      // extract the 'name' property
      if(!!attributes.name) {
        activityDefinition.name = attributes.name.value;
      }

      // extract the 'default' property (for the default flow)
      if(!!attributes['default']) {
        activityDefinition.properties.defaultFlowId = attributes['default'].value;
      }

      // set the type
      activityDefinition.typeId = element.tagName;

      // set and validate transitions
      if(!!sequenceFlows) {        
        var outgoingFlows = sequenceFlows[activityDefinition.id];
        if(!!outgoingFlows) {
          activityDefinition.transitions = outgoingFlows;

          if(!!activityDefinition.properties.defaultFlowId) { 

            var conditionalFlowFound = false;

            for(var i =0; i < outgoingFlows.length; i++) {
              var transition = outgoingFlows[i];

              if(!!transition.condition) {

                if(activityDefinition.properties.defaultFlowId == transition.id) {
                  throw "Sequence flow with id '" + transition.id + "' is configured to be the default flow but has a condition";
                } else {
                  // if a default flow is configured, there needs to be at least one conditional flow:
                  conditionalFlowFound = true;
                }
              }
            }  

            if(!conditionalFlowFound) {
                throw "Activity with id '"+activityDefinition.id+"' declares default flow with id '" + activityDefinition.properties.defaultFlowId + "' but has no conditional flows.";
            } 
          }  
        }
      }

      return activityDefinition;
    };

    /** loops over all <sequenceFlow .. /> elements and builds up a map of Transitions
     */
    function createTransitions(element) {
      element = element.firstChild;
      var index = {};

      do {
        
        if(element.nodeName == "sequenceFlow" || element.localName == "sequenceFlow") {
          var attrs = element.attributes;

          // handle sourceRef and targetRef
          var sourceRef = attrs.sourceRef.value;
          var targetRef = attrs.targetRef.value;          
          if(!index[sourceRef]) {
            index[sourceRef] = [];
          } 
          var transition = {};
          transition.to = targetRef;  

          // add to the index
          index[sourceRef].push(transition);
          
          // extract id
          if(!!attrs.id) {
            transition.id = attrs.id.value;
          }

          // extract conditions:
          var conditions = element.getElementsByTagName("conditionExpression");
          if(!!conditions && conditions.length >0) {
            var condition = conditions[0];
            do {
              transition.condition = condition.textContent;
            } while(condition = condition.nextSibling);
          }

        }

      } while(element = element.nextSibling);

      return index;
    };

    /** transform <startEvent ... /> elements */
    function transformStartEvent(element, scopeActivity, sequenceFlows) {
      var activity = createActivityDefinition(element, scopeActivity, sequenceFlows);      
      return activity;
    };

    /** transform <intermediateThrowEvent ... /> elements */
    function transformIntermediateThrowEvent(element, scopeActivity, sequenceFlows) {
      var activity = createActivityDefinition(element, scopeActivity, sequenceFlows);      
      return activity;
    };

    /** transform <endEvent ... /> elements */
    function transformEndEvent(element, scopeActivity, sequenceFlows) {
      var activity = createActivityDefinition(element, scopeActivity, sequenceFlows);      
      return activity;
    };

    /** transform <task ... /> elements */
    function transformTask(element, scopeActivity, sequenceFlows) {
      var activity = createActivityDefinition(element, scopeActivity, sequenceFlows);      
      return activity;
    };

    /** transform <userTask ... /> elements */
    function transformUserTask(element, scopeActivity, sequenceFlows) {
      var activity = createActivityDefinition(element, scopeActivity, sequenceFlows);      
      return activity;
    };

    /** transform <parallelGateway ... /> elements */
    function transformParallelGateway(element, scopeActivity, sequenceFlows) {
      var activity = createActivityDefinition(element, scopeActivity, sequenceFlows);      

      // count incoming sequence flows
      var incomingFlows = 0;
      for (activity in sequenceFlows) {
        
      }

      return activity;
    };

    /** transform <exclusiveGateway ... /> elements */
    function transformExclusiveGateway(element, scopeActivity, sequenceFlows) {
      var activity = createActivityDefinition(element, scopeActivity);  
      var outgoingFlows = activity.transitions;
      var defaultFlowId = activity.properties.defaultFlowId;

      // custom handling of sequence flows for exclusive GW:
      if(!!sequenceFlows) {        
        var outgoingFlows = sequenceFlows[activity.id];
        if(!!outgoingFlows) {
          activity.transitions = outgoingFlows;
        }       

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
      return activity;
    };

    /** invokes all parse listeners */
    function invokeParseListeners(activityDefinition, element, scopeActivity, scopeElement) {      
      for(var i=0; i<parseListeners.length; i++) {
        var parseListener = parseListeners[i];       
        parseListener(activityDefinition, element, scopeActivity, scopeElement);
      }
    }

    /** transforms all activites inside a scope into ActivityDefinitions */
    function transformScope(scopeElement, scopeActivity, sequenceFlows) {
      var element = scopeElement.firstChild;

      do {

        var activityDefinition = null;

        if(element.nodeName == "startEvent") {
          activityDefinition = transformStartEvent(element, scopeActivity, sequenceFlows);

        } else if(element.nodeName == "intermediateThrowEvent") {
          activityDefinition = transformIntermediateThrowEvent(element, scopeActivity, sequenceFlows);

        } else if(element.nodeName == "endEvent") {
          activityDefinition = transformEndEvent(element, scopeActivity, sequenceFlows);

        } else if(element.nodeName == "exclusiveGateway") {
          activityDefinition = transformExclusiveGateway(element, scopeActivity, sequenceFlows);

        } else if(element.nodeName == "userTask") {
          activityDefinition = transformUserTask(element, scopeActivity, sequenceFlows);
          
        } else if(element.nodeName == "task") {
          activityDefinition = transformTask(element, scopeActivity, sequenceFlows);

        } else if(element.nodeName == "parallelGateway") {
          activityDefinition = transformParallelGateway(element, scopeActivity, sequenceFlows);

        }        

        if(!!activityDefinition) {
          invokeParseListeners(activityDefinition, element, scopeActivity, scopeElement);
        }

      } while(element = element.nextSibling);
    };

    /** transforms a <process ... /> element into an activity definition */
    function transformProcess(processElement) {     

      var activityDefinition = createActivityDefinition(processElement);
      invokeParseListeners(activityDefinition, processElement);

      // build up a map for the sequence flows
      var transitions = createTransitions(processElement);
      // transform the activities
      transformScope(processElement, activityDefinition, transitions);   

      activityDefinitions.push(activityDefinition);   
    };

    /** transforms a <definitions ... /> element into a set of activity definitions */
    function transformDefinitions(definitionsElement) {
      var processes = definitionsElement.getElementsByTagName("process");
      for(var i =0; i <processes.length; i++) {
        transformProcess(processes[i]);
      }
    };

    transformDefinitions(definitions[0]);

    return activityDefinitions;
  };

  // expose public API
  CAM.transform = transform;
  CAM.parseListeners = parseListeners;

})(CAM);
