define([], function () {

  var helper =  {
    matchers : {
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
      }
    },

    findChildrenByType : function (group, type) {
      return this.findChildrenByProperties(group, {"type" : type});
    },

    findChildrenByProperties: function (group, props) {
      var matchedChildren = [];
      var stack = [].concat(group.children);

      while (stack.length > 0) {
        var element = stack.pop();

        var matchAllProps = true;

        for (var prop in props) {
          if (!element.shape[prop]) {
            matchAllProps = false;
          }

          console.log(props[prop]);
          console.log(element.shape[prop]);

          if (!(element.shape[prop] === props[prop])) {
            matchAllProps = false;
          }
        }

        if (matchAllProps === true) {
          matchedChildren.push(element);
        }

        if (!!element.children) {
          stack = stack.concat(element.children);
        }
      }

      return matchedChildren;
    }
  };

  return helper;
});