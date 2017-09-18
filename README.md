# Parse Server Client

Realy simple and lightweight REST client for [parse-server](https://github.com/parse/parse-server)

### Usage

```typescript
import PSC from 'psc';
import fetch from 'fetch-polyfill';

interface SomeObject {
    fooBar: string;
}

const config = {
    url: 'http://localhost/parse',
    applicationId: 'some-key'
}

const psc = new PSC(config, fetch);

const boundClient = await psc.login('username', 'password')
const query = boundClient.query<SomeObject>('ClassName');
query.equal('name', 'Hello')
const object = await query.first()
console.log(object.fooBar);


// Run a function with the master key
const result = await psc.Master.run('someFunction', { objectId: 'abc123' });
console.log(output);
```
