define([], function () {

  var matchElementShape = function(props) {
    return function (element) {
      var matchAllProps = true;

      for (var prop in props) {
        if (!element.shape[prop]) {
          matchAllProps = false;
        }

        if (!(element.shape[prop] === props[prop])) {
          matchAllProps = false;
        }
      }

      return matchAllProps;
    }
  };

  var matchElementProperty = function(elementProperty, props) {
    return function(element) {
      var elemProp = element[elementProperty];

      if(!elemProp) {
        return false;
      }

      var matchAllProps = true;

      for (var prop in props) {
        if (!elemProp[prop]) {
          matchAllProps = false;
        }

        if (!(elemProp[prop] === props[prop])) {
          matchAllProps = false;
        }
      }

      return matchAllProps;
    }
  };

  var helper =  {
    matchers : {
      toBeError: function() {
        return this.actual.toString().indexOf('Error') == 0;
      },
      toHavePositions : function (expectedShapePositions) {
        if (expectedShapePositions.length != this.actual.length) {
          return false;
        }

        var allMatch = true;

        for (var i = 0; i <this.actual.length; i++) {
          var shapeTransform = this.actual[i].getTransform();
          var expectedPos = expectedShapePositions[i];
          console.log(shapeTransform);

          if (expectedPos.y != shapeTransform.dy ||
              expectedPos.x != shapeTransform.dx){
            allMatch = false;
          }
        }

        return allMatch;
      },

      toBeInFrontOf: function(otherShape) {
        var thisShape = this.actual;

        var thisParents = [ ];
        var thisParent = thisShape;

        while (thisParent) {
          thisParents.push(thisParent);
          thisParent = thisParent.parent;
        }

        var otherParent = otherShape;
        var otherParentChild = null;

        // search parent hierachy for match with otherShape or any of its parents
        // if found, compare position of otherShape 
        do {

          var parentIdx = thisParents.indexOf(otherParent);
          if (parentIdx != -1) {
            // thisShape is child of otherShape
            if (!otherParentChild) {
              return true;
            }

            // otherShape is child of thisShape
            if (parentIdx === 0) {
              return false;
            }

            return otherParent.children.indexOf(otherParentChild) > otherParent.children.indexOf(thisParents[parentIdx - 1]);
          }

          otherParentChild = otherParent;
          otherParent = otherParent.parent;
        } while (otherParent);

        // not in the same tree
        return false;
      }
    },

    findChildrenByType : function (group, type) {
      return this.findChildrenByProperties(group, {"type" : type});
    },

    findChildren: function (group, shapeProps, elementProperty, propertyProps) {
      return this.findChildrenMatching(group, function (element) {
        var matches = true;

        if (shapeProps) {
          matches = matches && matchElementShape(shapeProps)(element);
        }

        if (elementProperty) {
          matches = matches && matchElementProperty(elementProperty, propertyProps)(element);
        }

        return matches;
      });
    },

    findChildrenByProperties: function (group, props) {
      return this.findChildrenMatching(group, matchElementShape(props));
    },

    findChildrenMatching: function (group, matchFn) {
      var matchedChildren = [];
      var stack = [].concat(group.children);

      while (stack.length > 0) {
        var element = stack.shift();
        var match = matchFn(element);

        if (match === true) {
          matchedChildren.push(element);
        }

        if (!!element.children) {
          stack = [].concat(element.children, stack);
        }
      }

      return matchedChildren;
    }
  };

  return helper;
});