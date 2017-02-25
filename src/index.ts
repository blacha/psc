export type SessionToken = 'USE_MASTER_KEY' | string;

export interface PSCConfig {
    url: string;
    applicationId: string;
    masterKey?: string;
}

export type SimpleFetch = (url: string, data: any) => Promise<any>;

export class PSCBoundClient {
    private sessionToken: SessionToken;
    private psc: PSC;
    constructor(psc, sessionToken: SessionToken) {
        this.psc = psc;
        this.sessionToken = sessionToken;
    }

    query<T>(className): PSCQuery<T> {
        return PSCQuery.query<T>(this, className)
    }

    run<T>(functionName: string, args: any): Promise<T> {
        return this.psc.run(functionName, args, this.sessionToken);
    }

    runQuery<T>(query: PSCQuery<T>): Promise<T[]> {
        return this.psc.runQuery(query, this.sessionToken);
    }
}

export default class PSC {
    static USE_MASTER_KEY = 'USE_MASTER_KEY';
    static version = '0.0.1';

    Master: PSCBoundClient;
    fetch: SimpleFetch;
    config: PSCConfig;

    constructor(config: PSCConfig, fetch?: SimpleFetch) {
        if (fetch == null) {
            throw new Error('Missing "fetch" function.');
        }

        this.config = config;
        this.fetch = fetch;

        this.Master = new PSCBoundClient(this, PSC.USE_MASTER_KEY);
    }

    login(username: string, password: string): Promise<PSCBoundClient> {
        var url = `${this.config.url}/login`;

        return this.request('GET', url, { username: username.toLowerCase(), password }, null)
            .then(data => new PSCBoundClient(this, data.sessionToken));
    }

    runQuery<T>(query: PSCQuery<T>, sessionToken: SessionToken): Promise<T[]> {
        const url = `${this.config.url}/classes/${query.className}`;

        return this.request('GET', url, query.toJSON(), sessionToken);
    }

    run<T>(functionName: string, args: any, sessionToken: SessionToken) {
        const url = `${this.config.url}/functions/${functionName}`;

        return this.request('POST', url, args, sessionToken);
    }

    private request(method: string, url: string, data, sessionToken: SessionToken): Promise<any> {
        if (sessionToken === PSC.USE_MASTER_KEY) {
            sessionToken = this.config.masterKey;
            if (sessionToken == null) {
                throw new Error('Unable to run masterKey request without masterKey');
            }
        }

        var requestBody = {
            _SessionToken: sessionToken,
            _ApplicationId: this.config.applicationId,
            _PSCVersion: PSC.version,
            _method: method
        };

        Object.keys(data).forEach(k => requestBody[k] = data[k]);

        return this.fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody)
        }).then(resp => {
            if (resp.status !== 200) {
                return Promise.reject(resp);
            }
            return resp.json();
        });
    }
}

export class PSCQuery<T> {
    public className: string;
    private queryLimit: number = 1000;
    private where = {};
    private psc: PSCBoundClient;

    constructor(psc: PSCBoundClient, className: string) {
        this.className = className;
        this.psc = psc;
    }

    static query<T>(psc: PSCBoundClient, className: string): PSCQuery<T> {
        return new PSCQuery(psc, className);
    }

    limit(limit: number) {
        this.queryLimit = limit;
        return this;
    }

    equal(field: string, value: string) {
        this.where[field] = value;
        return this;
    }

    in(field: string, $in: string[]) {
        this.where[field] = { $in };
        return this;
    }

    find(): Promise<T[]> {
        return this.psc.runQuery(this);
    }

    first(): Promise<T> {
        return this.psc.runQuery(this).then(objects => objects[0]);
    }

    toJSON() {
        return {
            limit: this.queryLimit,
            where: this.where
        }
    }
}
