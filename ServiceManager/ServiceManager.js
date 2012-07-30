define([
        'dojo/_base/declare',
        'dojo/_base/Deferred',
        'dojo/_base/lang',
        'dijit/registry',
        'dojo/aspect',
        'sijit/ServiceManager/Ref',
        'sijit/Common/Utils'
    ],
    function (
        declare,
        Deferred,
        lang,
        registry,
        aspect,
        Ref,
        Utils
    ) {
        // module:
        //		sijit/ServiceManager/ServiceManager

        return declare
        (
            'sijit.ServiceManager.ServiceManager',
            null,
            {
                // summary:
                //		An object used for dependency injection.
                //
                // description:
                //		The config property may be populated with a config object that
                //		defines what to inject.
                //
                // example:
                // |    errorService: {
                // |        moduleName: 'sijit/errorService/ErrorService',
                // |        values: {
                // |            dialogTitle: 'Ahhhh Error!'
                // |        },
                // |        createObjects: {
                // |        },
                // |        getObjects: {
                // |            errorApi: 'errorApi'
                // |        }
                // |        refObjects: {
                // |            errorDialog: 'sijit/errorController/ErrorDialog'
                // |        }
                // |    }
                //
                // The above config describes how to create an instance of the 'sijit/errorService/ErrorService'.
                // When `serviceManager.getObject('errorService')` this object will be returned.
                //
                // The moduleName attribute defines which module to load. If not already loaded, it will be loaded
                // async.
                //
                // The values object is an associatvie array of values to inject into the object. In this case,
                // errorService.dialogTitle will be set to 'Ahhhh Error!'
                //
                // The createObjects is an associative array of objects to create with the serviceManager
                // and inject. Once injected, they can be used as normal.
                //
                // The getObjects is an associative array of objects to load with the serviceManager
                // and inject. Once injected, they can be used as normal.
                //
                // The refObjects is an associatvie array of objects to inject a sijit.serviceManager.Ref instance for.
                // An refObject doesn't inject the object itself, but a reference to get or use the object later.
                //
                // refObject injections allow the lazy loading of dependencies - they are only
                // loaded when they are called.

                // _instances: array
                //      An array of all object created through the ServiceManager. If an object is requested
                //      more than once, it is retrieved from this array
                _instances: [],

                // _config: Object
                //      The configuration object. Defines what to inject into objects
                _config: {},


                constructor: function(){
                    // summary:
                    //     Attatches to the registry, so that declarively created dijits can be injected
                    aspect.after(registry, 'add', lang.hitch(this, function(widget){this.injectDijit(widget)}), true);
                },
                _createObject: function(/*string*/ identifier) {
                    // summary:
                    //     Used to create an object with the supplied identifier
                    // tags:
                    //     protected

                    var config = this.getObjectConfig(identifier);
                    
                    //Check for moduleName alias
                    var moduleName = identifier;
                    if (config && config.moduleName){
                        moduleName = config.moduleName;
                    }

                    //Create instance
                    var deferredObject = new Deferred();
                    var index = this._instances.length;
                    this._instances[index] = {identifier: identifier, object: null, promise: deferredObject};

                    require([moduleName], lang.hitch(this, function(Module){
                        var object = new Module;
                        Deferred.when(this._inject(object, config), lang.hitch(this, function(object){
                            this._instances[index].object = object;
                            this._instances[index].promise.resolve(object);
                        }))
                    }));

                    return deferredObject;
                },
                _getObject: function(/*string*/ identifier){
                    // summary:
                    //     Used to get an object with the supplied identifier
                    // tags:
                    //     protected

                    var index;

                    //Check for already created instance
                    for(index in this._instances){
                        if (this._instances[index].identifier == identifier){
                            return this._instances[index].object;
                        }
                    }

                    var config = this.getObjectConfig(identifier);

                    //Check to see if a dijit is wanted
                    var object = this._getRawDijitObject(identifier);
                    if (object) {
                        return this._inject(object, config);
                    }

                    //Create instance
                    return this._createObject(identifier);
                },
                _getRawDijitObject: function(/*string*/ identifier){
                    // summary:
                    //     Returns an uninjected dijit
                    // tags:
                    //     protected

                    var config = this.getObjectConfig(identifier);

                    var dijitId = identifier
                    if (config && config.dijitId) {
                        dijitId = config.dijitId;
                    }
                    return registry.byId(dijitId);
                },
                _isStateful: function(/*string*/ identifier){
                    // summary:
                    //     Checks if an identifier is a dijit, or marked as isStateful=true
                    // tags:
                    //     protected

                    var config = this.getObjectConfig(identifier);

                    if (this._getRawDijitObject(identifier) || (config && config.isStateful)) {
                        return true;
                    } else {
                        return false;
                    }
                },
                _inject: function(/* object */ object, /* object */ config){
                    // summary:
                    //     Used to inject an object with the objects defined in the
                    //     supplied config
                    //
                    // tags:
                    //     protected

                    //return early if there are not injections to do
                    if ( ! config){
                        return object;
                    }

                    var attr;
                    var deferredObject = new Deferred();
                    var injectionsRemaining = 0;
                    var earlyResolve = false;

                    //Determine how many async object loads need to finish before object is ready
                    if (config.createObjects) {
                        injectionsRemaining += Utils.countProperties(config.createObjects);
                    }
                    if (config.getObjects) {
                        injectionsRemaining += Utils.countProperties(config.getObjects);
                    }

                    if (injectionsRemaining == 0) {
                        earlyResolve = true;
                    }

                    //Inject variables
                    for (attr in config.values){
                        object[attr] = config.values[attr];
                    }

                    //Inject create objects
                    for (attr in config.createObjects){
                        Deferred.when(this.createObject(config.createObjects[attr]), function(injectionObject){
                            object[attr] = injectionObject;
                            --injectionsRemaining;
                            if (injectionsRemaining == 0){
                                deferredObject.resolve(object);
                            }
                        });
                    }

                    //Inject get objects
                    for (attr in config.getObjects){
                        Deferred.when(this.getObject(config.getObjects[attr]), function(injectionObject){
                            object[attr] = injectionObject;
                            --injectionsRemaining;
                            if (injectionsRemaining == 0){
                                deferredObject.resolve(object);
                            }
                        });
                    }

                    //Inject ref objects
                    for (attr in config.refObjects){
                        object[attr] = new Ref(
                            config.refObjects[attr],
                            this._isStateful(config.refObjects[attr]),
                            this
                        );
                    }

                    //Resove deferred if there were no async injections
                    if (earlyResolve) {
                        deferredObject.resolve(object);
                    }
                    return deferredObject;
                },
                clearInstanceCache: function(){
                    // summary:
                    //     Empties the cached instance array

                    this._instances = [];
                },
                mergeConfig: function(/* object */merge){
                    // summary:
                    //     Merge a config object with the existing config object.

                    this._config = Utils.mixinDeep(this._config, merge);
                },
                getConfig: function(){
                    // summary:
                    //     Return the complete config object

                    return this._config;
                },
                setConfig: function(/* object */ config){
                    this._config = config;
                },
                setObjectConfig: function(/* string */ identifier, /* object */ config) {
                    // summary:
                    //     Set the config object for a particular identifier

                    this._config[identifier] = config;
                },
                getObjectConfig: function(/* string */identifier){
                    // summary:
                    //     Return the config object for a particular identifier

                    for(var alias in this._config){
                        if (alias == identifier){
                            return this._config[alias];
                        }
                    }
                    return null;
                },
                createObject: function(/*string*/ identifier){
                    // summary:
                    //     Create a new instance of identifier.
                    //     Will replace cached copy of identifier, if it exists

                    return this._createObject(identifier);
                },
                getObject: function(/*string*/ identifier){
                    // summary:
                    //     Return a deferred that will resolve to the identifier requested.
                    //     Will return cached instance if one exists.

                    return this._getObject(identifier);
                },
                get: function(/*string*/ identifier, /*string*/ property) {
                    // summary:
                    //     Get the property value of the identifier. This may happen async.
                    //     The returned deferred will resovle to the property value when the get is complete.
                    //     This will only work for objects are dijits or configured as isStateful
                    var deferredSet = new Deferred();

                    if (!this._isStateful(identifier)){
                        throw ({
                            name: 'ObjectNotStateful',
                            message: 'get only works for dijits and objects marked as isStateful'
                        });
                    }

                    Deferred.when(this.getObject(identifier), function(object){
                        deferredSet.resolve(object.get(property));
                    });

                    return deferredSet;
                },
                set: function(/*string*/ identifier, /*string*/ property, /*mixed*/ value){
                    // summary:
                    //     Set the property of the identifier to a value. This may happen async.
                    //     The returned deferred will resovle to true when the set is complete.
                    //     This will only work for objects that are configured as dojo\Stateful

                    var deferredSet = new Deferred();

                    if (!this._isStateful(identifier)){
                        throw ({
                            name: 'ObjectNotStateful',
                            message: 'set only works for dijits and objects marked as isStateful'
                        });
                    }

                    Deferred.when(this.getObject(identifier), function(object){
                        object.set(property, value);
                        deferredSet.resolve(true);
                    });

                    return deferredSet;
                },
                watch: function(/* string */ identifier, /* string */ property, /* function */ callback){
                    // summary:
                    //     Apply a watch on the property of the identifier. Callback will
                    //     be called when the watch is activated. Applying the watch may happen async.
                    //     The returned deferred will resovle to the watchHandle when the watch apply is complete.
                    //     This will only work for objects that are configured as dojo\Stateful

                    var deferredWatch = new Deferred();

                    if (!this._isStateful(identifier)){
                        throw ({
                            name: 'ObjectNotStateful',
                            message: 'watch only works for dijits and objects marked as isStateful'
                        });
                    }

                    Deferred.when(this.getObject(identifier), function(object){
                        deferredWatch.resolve(object.watch(property, callback));
                    });

                    return deferredWatch;
                },
                inject: function(/* object */ object, /* string */ identifier){
                    // summary:
                    //     Use inject to inject an object created outside the serviceManager
                    //     with the serviceManager config

                    var config = this.getObjectConfig(identifier);
                    if (config){
                        object = this._inject(object, config);
                    }
                    return object;
                },
                injectDijit: function(widget){
                    // summary:
                    //     Use injectDijit to inject a dijit instance with the serviceManager config

                    var dijitId = widget.get('id');

                    for(var alias in this._config){
                        var config = this._config[alias];
                        if (alias == dijitId || config.dijitId == dijitId){
                            this._inject(widget, config);
                        }
                    }
                }
            }
        );
    }
);