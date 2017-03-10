import { PSCBoundClient } from '../../../src';
import { PSC } from '../../../src/index';
import { Server, Config } from './setup';

import * as fetch from 'node-fetch';


var BoundClient: PSCBoundClient = null;
Server
    .then(_ => {
        var rootPSC = new PSC({
            applicationId: Config.NAME,
            masterKey: Config.MASTER_KEY,
            url: Config.URL
        }, fetch);

        return rootPSC.login(Config.USER.NAME, Config.USER.PASS)
    })
    .then(boundClient => BoundClient = boundClient)
    // .then(_ => {
    //     var query = BoundClient.query('_User');
    //     query.equal('username', Config.USER.NAME);
    //     return query.first();
    // })
    // .then(currentUser => {
    //     currentUser.email = 'hello@world.com';
    //     console.log('current-user', JSON.stringify(currentUser))
    //     return BoundClient.save('_User', currentUser);
    // })
    // .then(newUser => console.log('new-user', newUser))
    // .then(_ => {
    //     var query = BoundClient.query('_User');
    //     query.equal('username', Config.USER.NAME);
    //     return query.first();
    // })

    .then(_ => BoundClient.save('FakeObject', { name: 'FakeOne', ACL: { '*': { read: true, write: true } } }))
    .then(fakeObject => {
        console.log('fakeObject', fakeObject)
        var query = BoundClient.query('FakeObject');
        query.equal('objectId', fakeObject.objectId)
        return query.first();
    })
    .then(fo => console.log('FO', fo))

    .catch(e => {
        if (e.status) {
            console.log(e.url, e.status, e.statusText)
        } else {
            console.log(e)
        }
    });
