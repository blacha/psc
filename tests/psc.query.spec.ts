import { PSCQuery, PSCBoundClient } from '../src';
import * as O from 'ospec';
const o = O.new();
export interface Foo {
    RandomObject: string;
}



o.spec('PSC.Query', () => {
    var boundPSC: PSCBoundClient = null;
    var output: Foo[] = [{ RandomObject: 'o' }];

    o.before(() => {
        boundPSC = <any>{
            query: null,
            runQuery: (obj) => Promise.resolve(output),
        }
    });

    // This test will fail if badly typed inside of "tsc"
    o('should compile with types', done => {
        var query = PSCQuery.query<Foo>(boundPSC, 'Foo');
        return query.first()
            .then(object => object.RandomObject)
            .then(random => o(random).equals('o'))
            .then(done);
    });

    o('should create $in', () => {
        var query = PSCQuery.query(boundPSC, 'Foo');
        query.in('hello', ['world']);
        var expectedAnswer = { limit: 1000, where: { hello: { $in: ['world'] } } };
        o(JSON.stringify(query.toJSON())).equals(JSON.stringify(expectedAnswer));
    });

    o('should create where', () => {
        var query = PSCQuery.query(boundPSC, 'Foo');
        query.equal('hello', 'world');
        var expectedAnswer = { limit: 1000, where: { hello: 'world' } };
        o(JSON.stringify(query.toJSON())).equals(JSON.stringify(expectedAnswer));
    });

    o('should create multiple wheres', () => {
        var query = PSCQuery.query(boundPSC, 'Foo');
        query.equal('hello', 'world');
        query.equal('hello2', 'world');
        var expectedAnswer = { limit: 1000, where: { hello: 'world', hello2: 'world' } };
        o(JSON.stringify(query.toJSON())).equals(JSON.stringify(expectedAnswer));
    })

});


o.run();