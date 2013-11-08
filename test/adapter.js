var promise = require('../async').promise;

exports.deferred = function() {

  var p = promise();

  return {
    promise: p,
    resolve: p.resolve,
    reject: p.reject
  };

};