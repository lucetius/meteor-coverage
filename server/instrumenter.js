if (IS_COVERAGE_ACTIVE) {
    //var im = Npm.require('istanbul-middleware');
    var istanbulAPI = Npm.require('istanbul-api'),
        Hook = istanbulAPI.libHook,
        Instrument = istanbulAPI.libInstrument,
        instrumenter = undefined;



    /**
     * hooks `runInThisContext` to add instrumentation to matching files when they are loaded on the server
     * @method hookLoader
     * @param {Object} opts instrumenter options
     */
    hookLoader = function (opts) {
        opts = opts || {};
        opts.verbose = true
        opts.coverageVariable = '__coverage__'; //force this always

        if (instrumenter !== undefined) {
            throw "Instrumenter already defined ! You cannot call this method twice";
        }
        instrumenter = Instrument.createInstrumenter(opts);
        var transformer = instrumenter.instrumentSync.bind(instrumenter);
        Hook.hookRunInThisContext(
            shallInstrumentServerScript,
            transformer,
            {
                verbose: opts.verbose,
            }
        );
    }

    instrumentJs = function (content, path, callback) {
        SourceMap.registerSourceMap(path);
        return instrumenter.instrument(content, path, callback);
    }


    getContains = function (configNamespace, file) {
        if (!_.isUndefined(Conf.include)) {

        }
    }

    shallInstrumentClientScript = function (fileurl) {
        if (fileurl.indexOf('.js') > -1) {
            let _inapp, _public;
            if (!_.isUndefined(Conf.include)) {
                _inapp = _.contains(Conf.include.clientside.inapp, fileurl);
                _public = _.contains(Conf.include.clientside.public, fileurl);
            }
            else {
                _inapp = !_.contains(Conf.ignore.clientside.inapp, fileurl);
                _public = !_.contains(Conf.ignore.clientside.public, fileurl);
            }
            if (fileurl.indexOf('packages') === 1) {
                if (_inapp) {
                    Log.info("[ClientSide][InApp] file instrumented: " + fileurl)
                    return true;
                } else {
                    Log.info("[ClientSide][InApp] file ignored: " + fileurl)
                }
            } else {
                if (_public) {
                    Log.info("[ClientSide][Public] file instrumented: " + fileurl)
                    return true;
                } else {
                    Log.info("[ClientSide][Public] file ignored: " + fileurl)
                }
            }
        }
        return false;
    }


    /**
     *
     * a match function with signature `fn(file)` that returns true if `file` needs to be instrumented
     * if the result is true, it also reads the corresponding source map
     * @returns {Function}
     */
    shallInstrumentServerScript = function (file) {
        var root = __meteor_bootstrap__.serverDir;
        if (file.indexOf(root) !== 0) {
            Log.info("[ServerSide][OutsideApp] file ignored: " + file)
            return false;
        }
        file = file.substring(root.length);
        if (file.indexOf('node_modules') >= 0) {
            Log.info("[ServerSide][node_modules] file ignored: " + file)
            return false;
        }
        if (!_.isUndefined(Conf.include)) {
            if (_.contains(Conf.include.serverside, file)) {
                SourceMap.registerSourceMap(root + file);
                Log.info("[ServerSide][App.js] file instrumented: " + file)
                return true;
            }
            else {
                Log.info("[ServerSide][Package] file ignored: " + file);
            }
        }
        else {
            if (file.indexOf('/packages') >= 0) {
                var packageName = file.split('/packages/');
                if (!_.contains(Conf.ignore.serverside, packageName[1])) {
                    SourceMap.registerSourceMap(root + file);
                    Log.info("[ServerSide][Package] file instrumented: " + file)
                    return true;
                } else {
                    Log.info("[ServerSide][Package] file ignored: " + file)
                }
            } else {
                SourceMap.registerSourceMap(root + file);
                Log.info("[ServerSide][App.js] file instrumented: " + file)
                return true;
            }
        }
        return false;
    }

    Instrumenter = {
        instrumentJs: instrumentJs,
        shallInstrumentClientScript: shallInstrumentClientScript,
        hookLoader: hookLoader
    }
}
