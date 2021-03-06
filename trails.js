window.Trails = (function() {
  Trails.prototype.options = {
    exceptionOnNotFound: true,
    redirectEmptyToRoot: true,
    onLoad: true
  };

  function Trails(options) {
    var handler, o;
    if (options != null) {
      for (o in this.options) {
        this.options[o] = options[o];
      }
    }
    handler = (function(_this) {
      return function(e) {
        var error;
        try {
          return _this._handle(e.currentTarget.location.href);
        } catch (_error) {
          error = _error;
          return console.error(error.message);
        }
      };
    })(this);
    if (this.options.onLoad) {
      window.onload = (function(_this) {
        return function() {
          var error;
          try {
            return _this._handle(window.location);
          } catch (_error) {
            error = _error;
            return console.error(error.message);
          }
        };
      })(this);
    }
    if (window.addEventListener) {
      window.addEventListener('hashchange', handler, false);
    } else if (window.attachEvent) {
      window.attachEvent('onhashchange', handler);
    } else {
      console.error('This browser is not supported by Trails.');
    }
  }

  Trails.prototype.routes = [];

  Trails.prototype.beforeAllHandlers = [];

  Trails.prototype.afterAllHandlers = [];

  Trails.prototype.route = function(path, handler) {
    var args, newRoute, originalPath, paramNames;
    path = path.indexOf('#') === 0 ? path : '#' + path;
    originalPath = path;
    args = Array.prototype.slice.call(arguments);
    path = args.shift();
    paramNames = path.match(/:([\w\d]+)/g) || [];
    paramNames = paramNames.map(function(x) {
      return x.substring(1);
    });
    path = new RegExp("^" + path.replace(/\./, '\\.').replace(/\*/g, '(.+)').replace(/:([\w\d]+)/g, "([^\/\?]+)") + '$');
    newRoute = {
      path: path,
      originalPath: originalPath,
      handler: handler,
      paramNames: paramNames
    };
    return this.routes.push(newRoute);
  };

  Trails.prototype.before = function(func) {
    return this.beforeAllHandlers.push(func);
  };

  Trails.prototype.after = function(func) {
    return this.afterAllHandlers.push(func);
  };

  Trails.prototype.beforeAll = function() {
    var h, _i, _len, _ref, _results;
    _ref = this.beforeAllHandlers;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      h = _ref[_i];
      _results.push(h());
    }
    return _results;
  };

  Trails.prototype.afterAll = function() {
    var h, _i, _len, _ref, _results;
    _ref = this.afterAllHandlers;
    _results = [];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      h = _ref[_i];
      _results.push(h());
    }
    return _results;
  };

  Trails.prototype.go = function(route) {
    return window.location.hash = route;
  };

  Trails.prototype.allRoutes = function() {
    return this.routes;
  };

  Trails.prototype._handle = function(url) {
    var args, frags, hasSearch, pair, param, params, path, proxyAnchor, route, routeParamValues, search, _i, _len;
    proxyAnchor = document.createElement('a');
    proxyAnchor.href = url;
    path = proxyAnchor.hash.replace('#!', '');
    hasSearch = path.indexOf('?') > -1;
    if (hasSearch) {
      search = path.substring(path.indexOf('?'));
      frags = search.slice(1).split('&');
      path = path.replace(search, '');
    }
    if (path.length === 0) {
      if (this.options.redirectEmptyToRoot) {
        path = '/';
      } else {
        return false;
      }
    }
    route = this._match(path);
    if (!route.handler) {
      if (this.options.exceptionOnNotFound) {
        throw new Error("ONOEZ!  Could not find a matching route for " + path);
      } else {
        return false;
      }
    }
    params = {};
    routeParamValues = route.path.exec(path);
    if (routeParamValues) {
      routeParamValues.shift();
      routeParamValues.map(decodeURIComponent).forEach(function(val, indx) {
        if (route.paramNames && route.paramNames.length > indx) {
          return params[route.paramNames[indx]] = val;
        } else if (val) {
          params.splat = params.splat || [];
          return params.splat.push(val);
        }
      });
    }
    if (hasSearch) {
      for (_i = 0, _len = frags.length; _i < _len; _i++) {
        param = frags[_i];
        pair = param.split('=');
        params[pair[0]] = pair[1] || "";
      }
    }
    args = {
      route: route.originalPath,
      computed: path,
      params: params
    };
    if (this.beforeAllHandlers.length > 0) {
      this.beforeAll(args);
    }
    route.handler(args);
    if (this.afterAllHandlers.length > 0) {
      return this.afterAll(args);
    }
  };

  Trails.prototype._match = function(path) {
    var r, route, _i, _len, _ref;
    route = {};
    _ref = this.routes;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      r = _ref[_i];
      if (path.match(r.path || decodeURIComponent(path).match(r.path))) {
        route = r;
      }
    }
    return route;
  };

  return Trails;

})();
