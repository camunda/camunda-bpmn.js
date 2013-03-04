define([], function () {

  return {
    findChildrenByType: function (group, type) {
      var typedChildren = [];
      var stack = [].concat(group.children);

      while (stack.length > 0) {
        var element = stack.pop();

        if (element.shape.type && element.shape.type == type) {
          typedChildren.push(element);
        }

        if (!!element.children) {
          stack = stack.concat(element.children);
        }
      }

      return typedChildren;
    }
  };

});