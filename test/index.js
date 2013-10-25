var assert = require("assert"),
    sinon = require("sinon"),
    async = require("../async"),
    when = async.when,
    whenAll = async.whenAll,
    promise = async.promise,
    fakes, p;


describe("test async module: ", function() {


  beforeEach(function() {

    fakes = sinon.sandbox.create();
    p = promise();

  });

  afterEach(function() {

    fakes.restore();
    p = null;

  });


  describe("object Promise", function() {

    it("should have 4 possible states", function() {

      assert.equal(-1, promise.proto.STATUS_PENDING);
      assert.equal(0, promise.proto.STATUS_RESOLVED);
      assert.equal(1, promise.proto.STATUS_REJECTED);
      assert.equal(2, promise.proto.STATUS_CANCELLED);

    });


    it("should have state -1 on creation", function() {

      assert.equal(-1, p.status);

    });

    it("should have state 0 if resolved", function() {

      p.resolve();
      assert.equal(0, p.status);

    });

    it("should have state 1 if rejected", function() {

      p.reject();
      assert.equal(1, p.status);

    });

    it("should have state 2 if cancelled", function() {

      p.cancel();
      assert.equal(2, p.status);

    });

    it("should register callbacks or false", function() {

      p.then(false, sinon.spy());
      p.then(sinon.spy(), false);
      p.then(sinon.spy(), sinon.spy());
      p.then(false, false);

      assert.equal(4, p.deferreds.length);

      assert.equal("boolean", typeof p.deferreds[0][0]);
      assert.equal("function", typeof p.deferreds[0][1]);
      assert.equal("function", typeof p.deferreds[1][0]);
      assert.equal("boolean", typeof p.deferreds[1][1]);
      assert.equal("function", typeof p.deferreds[2][0]);
      assert.equal("function", typeof p.deferreds[2][1]);
      assert.equal("boolean", typeof p.deferreds[3][0]);
      assert.equal("boolean", typeof p.deferreds[3][1]);

    });


    it("should throw an error for all other callback types", function() {


      assert.throws(function() {
        p.then({}, false);
      });

      assert.throws(function() {
        p.then(false, {});
      });


    });


    it("should immediately resolve if created with an initial value", function() {

      var r = 0,
          p = promise(10);

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

      p.then(success, fail);
      p.then(success, fail);

      p.resolve("test");

      assert.equal(2, success.callCount);
      assert.equal("test", success.args[0][0]);
      assert.equal("test", success.args[1][0]);

      assert.equal(0, fail.callCount);

      p.then(success, fail);
      p.then(success, fail);

      assert.equal(4, success.callCount);
      assert.equal("test", success.args[0][0]);
      assert.equal("test", success.args[1][0]);

      assert.equal(0, fail.callCount);

    });

    it("should reject any fail callbacks with a given value", function() {

      var success = sinon.spy(),
          fail = sinon.spy();

      p.then(success, fail);
      p.then(success, fail);

      p.reject("test");

      assert.equal(2, fail.callCount);
      assert.equal("test", fail.args[0][0]);
      assert.equal("test", fail.args[1][0]);

      assert.equal(0, success.callCount);

      p.then(success, fail);
      p.then(success, fail);

      p.reject("test");

      assert.equal(4, fail.callCount);
      assert.equal("test", fail.args[0][0]);
      assert.equal("test", fail.args[1][0]);

      assert.equal(0, success.callCount);

    });


    it("should not resolve if cancelled", function() {

      var success = sinon.spy(),
          fail = sinon.spy();

      p.then(success, fail);
      p.then(success, fail);

      p.cancel();
      p.resolve();

      assert.equal(0, success.callCount);

      p.then(success, fail);
      p.then(success, fail);

      assert.equal(0, success.callCount);


    });

    it("should not reject if cancelled", function() {

      var success = sinon.spy(),
          fail = sinon.spy();

      p.then(success, fail);
      p.then(success, fail);

      p.cancel();
      p.reject();

      assert.equal(0, fail.callCount);

      p.then(success, fail);
      p.then(success, fail);

      assert.equal(0, fail.callCount);

    });


    it("if resolved with a p it should defer resolution until the p resolves", function(done) {

      var success = sinon.spy(),
          p = promise();

      p.then(success);
      p.then(success);

      p.resolve(p);

      assert.equal(0, success.callCount);


      setTimeout(function() {

        p.resolve();

        assert.equal(2, success.callCount);

        done();

      }, 20);

    });




  });



  describe("function when", function() {

    it("should return a new resolved Promise if passed a non p value", function() {

      assert.equal(true, promise.proto.isPrototypeOf(when(10)));
      assert.equal(0, when(10).status);

    });

    it("should return it's param if passed a Promise", function() {

      var p = promise(50);

      assert.notEqual(p, when(promise()));
      assert.equal(p, when(p));

    });

  });


  describe("function whenAll", function() {

    it("should resolve it's promise when all it's parameters have resolved", function(done) {

      var spy = sinon.spy();
      var p = promise();

      whenAll([
        when(10),
        when(20),
        30,
        p
      ]).then(spy);

      setTimeout(function () {

        p.resolve(40);

        assert.equal(10, spy.args[0][0][0]);
        assert.equal(20, spy.args[0][0][1]);
        assert.equal(30, spy.args[0][0][2]);
        assert.equal(40, spy.args[0][0][3]);

        done();

      }, 20);

    });

    it("should reject it's promise if any of the parameter promises reject", function(done) {

      var spy = sinon.spy();
      var p = promise();

      whenAll([
        when(10),
        when(20),
        30,
        p
      ]).then(null, spy);

      setTimeout(function () {

        p.reject(40);

        assert.equal(40, spy.args[0][0]);

        done();

      }, 20);

    });


  });



});
