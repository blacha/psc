import PSC from '../src';

import * as O from 'ospec';
const o = O.new();
export interface Foo {

}

o.spec('PSC', () => {
    var outputJSON = {};
    var output = null;
    var requests = [];
    var stubbedFetch = (a, b) => {
        requests.push([a, b]);
        return output;
    };

    var config = {
        url: '/url',
        applicationId: 'applciationId'
    }

    o.beforeEach(() => {
        output = Promise.resolve({ status: 200, json: () => outputJSON });
        requests = [];
    });

    o('should login', done => {
        outputJSON = {
            sessionToken: 'sessionToken'
        }
        var psc = new PSC(config, stubbedFetch);
        psc.login('username', 'password')
            .then(data => {
                o(requests.length).equals(1);

                var [url, options] = requests.pop();
                o(url).equals('/url/login')
                o(options.method).equals('POST');

                var requestBody = JSON.parse(options.body);
                o(requestBody._ApplicationId).equals(config.applicationId);
                o(requestBody._SessionToken).equals(undefined);
                o(requestBody.username).equals('username');
                o(requestBody.password).equals('password');

                o((<any>data).sessionToken).equals('sessionToken');
            })
            .then(done);
    });

    o('should pass the masterkey', done => {
        var masterConfig = { url: config.url, applicationId: config.applicationId, masterKey: 'masterKey' };
        var psc = new PSC(masterConfig, stubbedFetch);

        psc.Master.run('foo', {})
            .then(output => {
                o(requests.length).equals(1);
                var [url, options] = requests.pop();
                o(url).equals('/url/functions/foo');

                var requestBody = JSON.parse(options.body);
                o(requestBody._MasterKey).equals(masterConfig.masterKey);
                o(requestBody._SessionToken).equals(undefined);
                done();
            });
    })

    o('should run a function', done => {
        var psc = new PSC(config, stubbedFetch);
        var args = {
            objectId: 'abc123'
        }

        psc.login('username', 'password')
            .then(boundClient => boundClient.run('functionName', args))
            .then(data => {
                o(requests.length).equals(2);
                // Login Request
                var [url, options] = requests.shift();
                o(url).equals('/url/login');
                o(options.method).equals('POST');

                // Function Request
                [url, options] = requests.shift();
                var requestBody = JSON.parse(options.body);
                o(url).equals('/url/functions/functionName');
                o(options.method).equals('POST');
                o(requestBody._ApplicationId).equals(config.applicationId);
                o(requestBody._SessionToken).equals('sessionToken');
                o(requestBody.objectId).equals('abc123');
            })
            .then(done);
    });
});

o.run();