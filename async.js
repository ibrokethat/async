/**
  @description  iteration
*/
require("Object");

var is      = require("is"),
    func    = require("func"),
    enforce = is.enforce,
    typeOf  = is.typeOf,
    partial = func.partial,
    bind    = func.bind,
    Promise;

/**
  @description  a lightweight promise implementation
*/
Promise = {


  STATUS_PENDING: -1,
  STATUS_RESOLVED: 0,
  STATUS_REJECTED: 1,
  STATUS_CANCELLED: 2,


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
    @description  fires all the callbacks
    @param        {number} status
    @param        {any} result
  */
  _exhaust: function (status, result) {

    var callback;

    if (this.status === this.STATUS_CANCELLED) return;

    if (typeOf(Promise, result)) {
      result.then(
        bind(this, this.resolve),
        bind(this, this.reject)
      );
      return;
    }

    while (this.deferreds.length) {

      callback = this.deferreds.shift()[status];

      if (typeof callback === "function") {

        callback(result);

      }

    }

    this.status = status;
    this.result = result;

  }

};

/**
  @description  resolve the promise
  @param        {any} result
*/
Promise.resolve = bind(Promise._exhaust, Promise.STATUS_RESOLVED);


/**
  @description  reject the promise
  @param        {any} result
*/
Promise.reject = bind(Promise._exhaust, Promise.STATUS_REJECTED);




/**
  @description  wraps a value in a promise unless it already is one
  @param        {any} promise or value
  @return       {Promise}
*/
function when(value) {

  return typeOf(Promise, value) ? value : Promise.spawn(value);

}


exports.Promise = Promise;
exports.when    = when;
