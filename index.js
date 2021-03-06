/*jslint indent: 4, maxlen: 80, node: true */
(function () {
    'use strict';

    var // Classes
        DependencyUpdater,

        // Functions
        handleFile,

        // Requires
        fs = require('fs'),
        exec = require('child_process').exec;

    DependencyUpdater = function () {
        var // Functions
            updateDependency,
            addDependency,
            updateNext,

            // Variables
            self = {},
            dependencies = [];

        updateDependency = function (dep, cb) {
            var name = dep.name;
            if (dep.name.constructor === Object && dep.name.name !== undefined) {
                var version = dep.name.version;
                if (version.indexOf('#') > -1){
                    if (version.indexOf('#master') > -1){
                        name = version;
                    } else {
                        name = version.split('#')[0];
                    }
                }
            }
            if (typeof name != "string") {
                name = name.name;
            }
            var command = 'bower install "' + name + '" --force-latest --save';

            if (dep.dev) {
                command += '-dev';
            }

            exec(command, function (err) {
                if (err) {
                    console.log('✘ Error updating ' + name + ' - ' + err);
                } else {
                    console.log('✔ ' + name);
                }

                cb();
            });
        };

        addDependency = function (name, dev) {
            dependencies.push({
                name: name,
                dev: !!dev
            });
        };

        updateNext = function () {
            if (dependencies.length) {
                updateDependency(
                    dependencies.shift(),
                    updateNext
                );
            } else {
                console.log('➤ All dependencies updated!');
            }
        };

        self.addDependency = addDependency;
        self.updateNext = updateNext;

        return self;
    };

    handleFile = function (err, data) {
        if (err) {
            console.log('✘ Problem getting your file, please try again.');
            return;
        }

        console.log('➤ Getting and parsing bower.json file...');

        var bowerJson = JSON.parse(data),
            updater = new DependencyUpdater();

        if (bowerJson.dependencies) {
            Object
                .keys(bowerJson.dependencies)
                .map(function (key) { return {"name": key,"version":bowerJson.dependencies[key]}; })
                .forEach(function (dep) {
                    updater.addDependency(dep);
                });
        }

        if (bowerJson.devDependencies) {
            Object
                .keys(bowerJson.devDependencies)
                .forEach(function (dep) {
                    updater.addDependency(dep, true);
                });
        }

        updater.updateNext();
    };

    fs.readFile('bower.json', 'utf-8', handleFile);
}());
