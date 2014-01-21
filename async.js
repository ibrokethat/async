/**
  @description  a promise implementation
  @author       si@ibrokethat.com
*/


var is       = require('super-is');
var func     = require('super-func');
var enforce  = is.enforce;
var typeOf   = is.typeOf;
var lateBind = func.lateBind;
var bind     = func.bind;
var partial  = func.partial;
var proto;


proto = {


  STATUS_PENDING: -1,
  STATUS_RESOLVED: 0,
  STATUS_REJECTED: 1,
  STATUS_CANCELLED: 2,

  _timer: null,

  __init__: function(value) {

    this.deferreds = [];
    this.status = this.STATUS_PENDING;

    if (!typeOf("undefined", value)) {
      this.resolve(value);
    }

  },


  /**
    @description  cancels the promise
  */
  cancel: function () {

    this.status = this.STATUS_CANCELLED;

  },


  /**
    @description  registers callback functions for both resolutions and rejection
    @param        {function} resolve
    @param        {function} reject
    @return       {this}
  */
  then: function (resolve, reject) {

    if (resolve) enforce("function", resolve);
    if (reject) enforce("function", reject);

    this.deferreds.push([resolve, reject]);

    if (this.status !== this.STATUS_PENDING) {
      this._exhaust(this.status, this.result);
    }

    return this;

  },


  /**
    @description  sets the timeout to fire after a specific interval
    @param        {function} resolve
    @param        {function} reject
    @return       {this}
  */
  timeout: function (time, message) {

    this._timer = setTimeout(bind(this, this.reject, message), time);

  },

  /**
    @description  fires all the callbacks
    @param        {number} status
    @param        {any} result
  */
  _exhaust: function (status, result) {

    var callback;
    clearTimeout(this._timer);
    if (this.status === this.STATUS_CANCELLED) return;

    if (typeOf(proto, result)) {
      result.then(
        bind(this, this.resolve),
        bind(this, this.reject)
      );
      return;
    }

    while (this.deferreds.length) {

      callback = this.deferreds.shift()[status];
      callback(result);
      // setImmediate(partial(callback, result));

    }

    this.status = status;
    this.result = result;

  }

};

/**
  @description  resolve the promise
  @param        {any} result
*/
proto.resolve = lateBind(proto._exhaust, proto.STATUS_RESOLVED);


/**
  @description  reject the promise
  @param        {any} result
*/
proto.reject = lateBind(proto._exhaust, proto.STATUS_REJECTED);



/**
  @description  calls a function, passing in a promise and binding any incoming parameters
  @param        {function} func
  @param        {any} args1...
  @return       {Promise}
*/
function promise (value) {

  var p = Object.create(proto);
  p.__init__(value);
  return p;
}

promise.proto = proto;

/**
  @description  wraps a value in a promise unless it already is one
  @param        {any} value promise or value
  @return       {promise}
*/
function when (value) {

  return typeOf(proto, value) ? value : promise(value);
}



/**
  @description  resolves a promise after all its parameters have resolved
  @param        {array} args An array of promises or values
  @return       {promise}
*/
function whenAll (args) {

  var p;
  var f;
  var i = 0;
  var l = args.length;
  var results = [];

  p = promise();

  f = function() {

    when(args[i++]).then(function(data) {

      results.push(data);

      if(i < l) {
        f();
      }
      else {
        p.resolve(results);
      }
      return data;
    },
    bind(p, p.reject));
  };

  f();

  return p;
}


exports.promise = promise;
exports.when = when;
exports.whenAll = whenAll;