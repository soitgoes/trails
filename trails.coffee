class window.Trails
  options:
    exceptionOnNotFound: true
    redirectEmptyToRoot: true
    onLoad: true

  constructor: (options) ->
    for o of options
      @options[o] = options[o]

    window.onhashchange = (e) =>
      try
        @_handle e.newURL
      catch error
        console.error error.message
    
    if @options.onLoad
      window.onload = =>
        try
          @_handle window.location
        catch error
          console.error error.message
      
  routes: []
  beforeAllHandlers: []
  afterAllHandlers: []

  route: (path, handler) ->
    originalPath = path
    args = Array.prototype.slice.call(arguments)
  
    path = args.shift()

    paramNames = path.match(/:([\w\d]+)/g) || []
    paramNames = paramNames.map (x) -> x.substring(1)

    path = new RegExp "^" + path.replace(/\./, '\\.').replace(/\*/g, '(.+)').replace(/:([\w\d]+)/g, "([^\/\?]+)") + '$'
    newRoute =
      path: path
      originalPath: originalPath
      handler: handler
      paramNames: paramNames
        
    @routes.push(newRoute)
 
  before: (func) ->
    @beforeAllHandlers.push func

  after: (func) ->
    @afterAllHandlers.push func

  beforeAll: ->
    for h in @beforeAllHandlers
      h()

  afterAll: ->
    for h in @afterAllHandlers
      h()

  allRoutes: ->
    this.routes

  _handle: (url) ->
    proxyAnchor = document.createElement 'a'
    proxyAnchor.href = url
    path = proxyAnchor.hash.replace '#!', ''
    
    if path.length is 0
      if @options.redirectEmptyToRoot
        window.location.hash = '#!'
      else
        return false

    route = @_match path
    
    unless route.handler
      if @options.exceptionOnNotFound
        throw new Error "ONOEZ!  Could not find a matching route for #{path}"
      else
        return false

    params = {}
    routeParamValues = route.path.exec(path)

    if routeParamValues
      routeParamValues.shift() # Remove the initial match
      routeParamValues.map(decodeURIComponent).forEach (val, indx) ->
        if route.paramNames and route.paramNames.length > indx
          params[route.paramNames[indx]] = val
        else if val
          params.splat = params.splat || []
          params.splat.push val
    
    args =
      route: route.originalPath
      computed: path
      params: params

    if @beforeAllHandlers.length > 0
      @beforeAll args

    route.handler args

    if @afterAllHandlers.length > 0
      @afterAll args
  
  _match: (path) ->

    route = {}

    for r in this.routes
      if path.match r.path || decodeURIComponent(path).match r.path
        route = r

    route
