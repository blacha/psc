import PSC from './index';
// import fetch from 'fetch-polyfill';

declare var fetch;
declare var console;

interface SomeObject {
    fooBar: string;
}

const config = {
    url: 'http://localhost/parse',
    applicationId: 'some-key'
}

const psc = new PSC(config, fetch);

psc.login('username', 'password')
    .then(boundClient => {
        var query = boundClient.query<SomeObject>('ClassName');
        query.equal('name', 'Hello')
        return query.first()
    })
    .then(object => console.log(object.fooBar));


// Run a function with the master key
psc.Master.run('someFunction', { objectId: 'abc123' })
    .then(output => console.log(output))
