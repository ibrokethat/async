var assert  = require("assert"),
    sinon   = require("sinon"),
    async   = require("../ibt-async"),
    when    = async.when,
    Promise = async.Promise,
    fakes, promise;


describe("test async module: ", function() {


  beforeEach(function() {

    fakes = sinon.sandbox.create();
    promise = Promise.spawn();

  });

  afterEach(function() {

    fakes.restore();
    promise = null;

  });


  describe("object Promise", function() {

    it("should have 4 possible states", function() {

      assert.equal(-1, Promise.STATUS_PENDING);
      assert.equal(0, Promise.STATUS_RESOLVED);
      assert.equal(1, Promise.STATUS_REJECTED);
      assert.equal(2, Promise.STATUS_CANCELLED);

    });


    it("should have state -1 on creation", function() {

      assert.equal(-1, promise.status);

    });

    it("should have state 0 if resolved", function() {

      promise.resolve();
      assert.equal(0, promise.status);

    });

    it("should have state 1 if rejected", function() {

      promise.reject();
      assert.equal(1, promise.status);

    });

    it("should have state 2 if cancelled", function() {

      promise.cancel();
      assert.equal(2, promise.status);

    });

    it("should register callbacks or false", function() {

      promise.then(false, sinon.spy());
      promise.then(sinon.spy(), false);
      promise.then(sinon.spy(), sinon.spy());
      promise.then(false, false);

      assert.equal(4, promise.deferreds.length);

      assert.equal("boolean", typeof promise.deferreds[0][0]);
      assert.equal("function", typeof promise.deferreds[0][1]);
      assert.equal("function", typeof promise.deferreds[1][0]);
      assert.equal("boolean", typeof promise.deferreds[1][1]);
      assert.equal("function", typeof promise.deferreds[2][0]);
      assert.equal("function", typeof promise.deferreds[2][1]);
      assert.equal("boolean", typeof promise.deferreds[3][0]);
      assert.equal("boolean", typeof promise.deferreds[3][1]);

    });


    it("should throw an error for all other callback types", function() {


      assert.throws(function() {
        promise.then({}, false);
      });

      assert.throws(function() {
        promise.then(false, {});
      });


    });


    it("should immediately resolve if created with an initial value", function() {

      var r = 0,
          p = Promise.spawn(10);

      assert.equal(0, r);
      assert.equal(0, p.status);

      p.then(function(v) {
        r = v;
      });

      assert.equal(10, r);

    });


    it("should resolve any success callbacks with a given value", function() {

      var success = sinon.spy(),
          fail = sinon.spy();

      promise.then(success, fail);
      promise.then(success, fail);

      promise.resolve("test");

      assert.equal(2, success.callCount);
      assert.equal("test", success.args[0][0]);
      assert.equal("test", success.args[1][0]);

      assert.equal(0, fail.callCount);

      promise.then(success, fail);
      promise.then(success, fail);

      assert.equal(4, success.callCount);
      assert.equal("test", success.args[0][0]);
      assert.equal("test", success.args[1][0]);

      assert.equal(0, fail.callCount);

    });

    it("should reject any fail callbacks with a given value", function() {

      var success = sinon.spy(),
          fail = sinon.spy();

      promise.then(success, fail);
      promise.then(success, fail);

      promise.reject("test");

      assert.equal(2, fail.callCount);
      assert.equal("test", fail.args[0][0]);
      assert.equal("test", fail.args[1][0]);

      assert.equal(0, success.callCount);

      promise.then(success, fail);
      promise.then(success, fail);

      promise.reject("test");

      assert.equal(4, fail.callCount);
      assert.equal("test", fail.args[0][0]);
      assert.equal("test", fail.args[1][0]);

      assert.equal(0, success.callCount);

    });


    it("should not resolve if cancelled", function() {

      var success = sinon.spy(),
          fail = sinon.spy();

      promise.then(success, fail);
      promise.then(success, fail);

      promise.cancel();
      promise.resolve();

      assert.equal(0, success.callCount);

      promise.then(success, fail);
      promise.then(success, fail);

      assert.equal(0, success.callCount);


    });

    it("should not reject if cancelled", function() {

      var success = sinon.spy(),
          fail = sinon.spy();

      promise.then(success, fail);
      promise.then(success, fail);

      promise.cancel();
      promise.reject();

      assert.equal(0, fail.callCount);

      promise.then(success, fail);
      promise.then(success, fail);

      assert.equal(0, fail.callCount);

    });


    it("if resolved with a promise it should defer resolution until the promise resolves", function(done) {

      var success = sinon.spy(),
          p = Promise.spawn();

      promise.then(success);
      promise.then(success);

      promise.resolve(p);

      assert.equal(0, success.callCount);


      setTimeout(function() {

        p.resolve();

        assert.equal(2, success.callCount);

        done();

      }, 20);

    });




  });



  describe("function when", function() {

    it("should return a new resolved Promise if passed a non promise value", function() {

      assert.equal(true, Promise.isPrototypeOf(when(10)));
      assert.equal(0, when(10).status);

    });

    it("should return it's param if passed a Promise", function() {

      var p = Promise.spawn(50);

      assert.notEqual(p, when(Promise.spawn()));
      assert.equal(p, when(p));

    });


  });


});