import PSC from '../src';

import * as O from 'ospec';
const o = O.new();
export interface Foo {

}

o.spec('PSC', () => {
    var requests = [];
    var response = {
        ok: true,
        headerJson: {},
        headers: {
            get: key => response.headerJson[key.toLowerCase()]
        },
        output: {},
        json: _ => Promise.resolve(response.output)
    };

    var stubbedFetch = (a, b) => {
        requests.push([a, b]);
        return Promise.resolve(response);
    };

    var config = {
        url: '/url',
        applicationId: 'applciationId'
    }

    o.beforeEach(() => {
        response.output = { sessionToken: 'sessionToken' };
        response.ok = true;
        response.json = _ => Promise.resolve(response.output);
        response.headerJson = { 'content-type': 'application/json' }
        requests = [];
    });

    o('should login', done => {
        response.output = {
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

    o('should reject with json objects', done => {
        const message = 'FakeMessage';
        response.ok = false;
        response.output = { message };

        var psc = new PSC(config, stubbedFetch);
        psc.run('TestFunction', {}, 'FakeSession')
            .catch(e => {
                o(typeof e).equals('object');
                o(e instanceof Error).equals(false);
                o(e.message).equals(message);
                done();
            })
    })

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
