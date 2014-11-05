/**
 * from branding-fe/wave (https://github.com/branding-fe/wave)
 */

define(function() {
var wave, _Bezier_, _WaveFragment_, _util_;
_Bezier_ = function (require) {
  /**
   * @constructor
   */
  function Bezier(var_args) {
    var args = [].slice.call(arguments, 0);
    if (Object.prototype.toString.call(args[0]) === '[object Array]') {
      args = args[0];
    }
    if (args.length % 2) {
      throw 'coordinate count should be even.';
    }
    this.points = [];
    for (var i = 0; i < args.length; i += 2) {
      this.points.push({
        x: args[i],
        y: args[i + 1]
      });
    }
    this.actualPoints = this.points.slice(0);
    this.actualPoints.unshift({
      x: 0,
      y: 0
    });
    this.actualPoints.push({
      x: 1,
      y: 1
    });
    this.sampleCache = {};
    this.factorialCache = {};
    this.order = this.actualPoints.length - 1;
    this.splineSampleCount = 11;
    this.splineSamples = [];
    this.splineInterval = 1 / (this.splineSampleCount - 1);
    this.calcSplineSamples();
  }
  Bezier.consts = {
    NEWTON_ITERATIONS: 4,
    NEWTON_MIN_SLOPE: 0.001,
    SUBDIVISION_PRECISION: 1e-7,
    SUBDIVISION_MAX_ITERATIONS: 10
  };
  Bezier.prototype.calcSplineSamples = function () {
    for (var i = 0; i < this.splineSampleCount; i++) {
      this.splineSamples[i] = this.getFromT(i * this.splineInterval);
    }
  };
  Bezier.prototype.get = function (x) {
    var guessT = this.getTFromX(x);
    return this.getFromT(guessT).y;
  };
  Bezier.prototype.getTFromX = function (x) {
    var tStart = 0;
    var index = 0;
    for (var i = 1; i < this.splineSampleCount; i++) {
      if (i === this.splineSampleCount - 1 || this.splineSamples[i].x > x) {
        tStart = this.splineInterval * (i - 1);
        index = i - 1;
        break;
      }
    }
    var tPossible = tStart + this.splineInterval * (x - this.splineSamples[index].x) / (this.splineSamples[index + 1].x - this.splineSamples[index].x);
    var derivative = this.getDerivativeFromT(tPossible);
    if (derivative.x >= Bezier.consts.NEWTON_MIN_SLOPE) {
      return this.runNewtonRaphsonIterate(x, tPossible);
    } else if (derivative.x == 0) {
      return tPossible;
    } else {
      return this.runBinarySubdivide(x, tStart, tStart + this.splineInterval);
    }
  };
  Bezier.prototype.runNewtonRaphsonIterate = function (x, tPossible) {
    for (var i = 0; i < Bezier.consts.NEWTON_ITERATIONS; i++) {
      var derivative = this.getDerivativeFromT(tPossible);
      if (derivative.x == 0) {
        return tPossible;
      } else {
        var dx = this.getFromT(tPossible).x - x;
        tPossible -= dx / derivative.x;
      }
    }
    return tPossible;
  };
  Bezier.prototype.runBinarySubdivide = function (x, tStart, tEnd) {
    var tPossible;
    for (var i = 0; i < Bezier.consts.SUBDIVISION_MAX_ITERATIONS; i++) {
      tPossible = tStart + (tEnd - tStart) / 2;
      var dx = this.getFromT(tPossible).x - x;
      if (dx <= Bezier.consts.SUBDIVISION_PRECISION) {
        return tPossible;
      } else if (dx > 0) {
        tEnd = tPossible;
      } else {
        tStart = tPossible;
      }
    }
    return tPossible;
  };
  Bezier.prototype.getFromT = function (t) {
    var coeffs = this.getCoefficients();
    var x = 0;
    var y = 0;
    var n = this.order;
    for (var j = 0; j <= n; j++) {
      x += coeffs[j].x * Math.pow(t, j);
      y += coeffs[j].y * Math.pow(t, j);
    }
    return {
      x: x,
      y: y
    };
  };
  Bezier.prototype.getCoefficients = function () {
    if (this.coefficients) {
      return this.coefficients;
    }
    var n = this.order;
    this.coefficients = [];
    for (var j = 0; j <= n; j++) {
      var xsum = 0;
      var ysum = 0;
      for (var i = 0; i <= j; i++) {
        var pcoeff = Math.pow(-1, i + j) / (this.getFactorial(i) * this.getFactorial(j - i));
        xsum += pcoeff * this.actualPoints[i].x;
        ysum += pcoeff * this.actualPoints[i].y;
      }
      var ccoeff = this.getFactorial(n) / this.getFactorial(n - j);
      this.coefficients.push({
        x: ccoeff * xsum,
        y: ccoeff * ysum
      });
    }
    return this.coefficients;
  };
  Bezier.prototype.getFactorial = function (n) {
    if (this.factorialCache[n]) {
      return this.factorialCache[n];
    }
    if (n === 0) {
      return 1;
    } else {
      this.factorialCache[n] = n * this.getFactorial(n - 1);
      return this.factorialCache[n];
    }
  };
  Bezier.prototype.getDerivativeFromT = function (t) {
    var coeffs = this.getCoefficients();
    var x = 0;
    var y = 0;
    var n = this.order;
    for (var j = 1; j <= n; j++) {
      x += j * coeffs[j].x * Math.pow(t, j - 1);
      y += j * coeffs[j].y * Math.pow(t, j - 1);
    }
    return {
      x: x,
      y: y
    };
  };
  Bezier.prototype.getSamples = function (count) {
    if (this.sampleCache[count]) {
      return this.sampleCache[count];
    }
    var samples = [];
    for (var i = 0; i < count; i++) {
      samples.push(this.get(i / (count - 1)));
    }
    this.sampleCache[count] = samples;
  };
  Bezier.prototype.getEasing = function () {
    var me = this;
    return function (x) {
      return me.get(x);
    };
  };
  return Bezier;
}({});
_WaveFragment_ = function (require) {
  var easeInCurves = {
    'Quad': function (p) {
      return p * p;
    },
    'Cubic': function (p) {
      return p * p * p;
    },
    'Quart': function (p) {
      return p * p * p * p;
    },
    'Qunit': function (p) {
      return p * p * p * p * p;
    },
    'Expo': function (p) {
      return p * p * p * p * p * p;
    },
    'Sine': function (p) {
      return 1 - Math.cos(p * Math.PI / 2);
    },
    'Circ': function (p) {
      return 1 - Math.sqrt(1 - p * p);
    },
    'Back': function (p) {
      return p * p * (3 * p - 2);
    },
    'Elastic': function (p) {
      return p === 0 || p === 1 ? p : -Math.pow(2, 8 * (p - 1)) * Math.sin(((p - 1) * 80 - 7.5) * Math.PI / 15);
    },
    'Bounce': function (p) {
      var pow2;
      var bounce = 4;
      while (p < ((pow2 = Math.pow(2, --bounce)) - 1) / 11) {
      }
      return 1 / Math.pow(4, 3 - bounce) - 7.5625 * Math.pow((pow2 * 3 - 2) / 22 - p, 2);
    }
  };
  var Bezier = _Bezier_;
  var fastInCurves = {
    'B2ToLinear': function () {
      var easing = new Bezier(0, 0.4, 0.2, 0.4, 0.4, 0.55).getEasing();
      return function (p) {
        return easing(p);
      };
    }()
  };
  return {
    'easeInCurves': easeInCurves,
    'fastInCurves': fastInCurves
  };
}({});
_util_ = {
  repeat: function (easing, repeatCount) {
    var stepCount = repeatCount * 2 - 1;
    return function (p) {
      var tmp = p * stepCount;
      var curStep = Math.floor(tmp);
      var newP = tmp - curStep;
      var result = easing(newP);
      if (curStep % 2) {
        result = 1 - result;
      }
      return result;
    };
  },
  reverse: function (easing) {
    return function (p) {
      return 1 - easing(1 - p);
    };
  },
  reflect: function (easing) {
    return function (p) {
      return 0.5 * (p < 0.5 ? easing(2 * p) : 2 - easing(2 - 2 * p));
    };
  }
};
wave = function (require) {
  var Bezier = _Bezier_;
  var Easings = {
    'linear': function (p) {
      return p;
    },
    'none': function (p) {
      return 0;
    },
    'full': function (p) {
      return 1;
    },
    'reverse': function (p) {
      return 1 - p;
    },
    'swing': function (p) {
      return 0.5 - Math.cos(p * Math.PI) / 2;
    },
    'spring': function (p) {
      return 1 - Math.cos(p * 4.5 * Math.PI) * Math.exp(-p * 6);
    }
  };
  var WaveFragment = _WaveFragment_;
  var util = _util_;
  var easeInCurves = WaveFragment['easeInCurves'];
  for (var name in easeInCurves) {
    var fragment = easeInCurves[name];
    Easings['easeIn' + name] = fragment;
    Easings['easeOut' + name] = util.reverse(fragment);
    Easings['easeInOut' + name] = util.reflect(fragment);
    Easings['easeOutIn' + name] = util.reflect(util.reverse(fragment));
  }
  var fastInCurves = WaveFragment['fastInCurves'];
  for (var name in fastInCurves) {
    var fragment = fastInCurves[name];
    Easings['fastIn' + name] = fragment;
    Easings['fastOut' + name] = util.reverse(fragment);
    Easings['fastInOut' + name] = util.reflect(fragment);
    Easings['fastOutIn' + name] = util.reflect(util.reverse(fragment));
  }
  var easingBezierMap = {
    'ease': [
      0.25,
      0.1,
      0.25,
      1
    ],
    'ease-in': [
      0.42,
      0,
      1,
      1
    ],
    'ease-out': [
      0,
      0,
      0.58,
      1
    ],
    'ease-in-out': [
      0.42,
      0,
      0.58,
      1
    ]
  };
  for (var name in easingBezierMap) {
    Easings[name] = new Bezier(easingBezierMap[name]).getEasing();
  }
  function wave(value) {
    if (Object.prototype.toString.call(value) === '[object String]') {
      return Easings[value] || null;
    } else if (Object.prototype.toString.call(value) === '[object Array]') {
      return new Bezier(value).getEasing();
    } else {
      return null;
    }
  }
  wave.register = function (name, value) {
    if (Object.prototype.toString.call(value) === '[object Function]') {
      Easings[name] = value;
    } else {
      var easing = wave(value);
      if (easing) {
        Easings[name] = easing;
      } else {
        throw 'unregisterable';
      }
    }
  };
  wave.getMap = function () {
    return Easings;
  };
  return wave;
}({});
return wave;
});
