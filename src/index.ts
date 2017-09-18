export type SessionToken = 'USE_MASTER_KEY' | string;

export interface PSCConfig {
    url: string;
    applicationId: string;
    masterKey?: string;
}

export type SimpleFetch = (url: string, data: any) => Promise<any>;

export class PSCBoundClient {

    sessionToken: SessionToken;
    psc: PSC;

    constructor(psc, sessionToken: SessionToken) {
        this.psc = psc;
        this.sessionToken = sessionToken;
    }

    query<T>(className): PSCQuery<T> {
        return PSCQuery.query<T>(this.psc, this.sessionToken, className)
    }

    run<T>(functionName: string, args: any): Promise<T> {
        return this.psc.run(functionName, args, this.sessionToken);
    }
    save<T>(className: string, obj: T): Promise<T> {
        return this.psc.save(className, obj, this.sessionToken);
    }

    runQuery<T>(query: PSCQuery<T>): Promise<T[]> {
        return this.psc.runQuery(query, this.sessionToken);
    }
}

interface ParseRequestBody {
    _SessionToken?: string;
    _MasterKey?: string;
    _ApplicationId: string;
    _method: string;
}

const HEADER_CONTENT_JSON = 'application/json';
const HEADERS = {
    'Content-Type': HEADER_CONTENT_JSON
};

export class PSC {
    static USE_MASTER_KEY = 'USE_MASTER_KEY';

    _Master: PSCBoundClient;
    fetch: SimpleFetch;
    config: PSCConfig;

    constructor(config: PSCConfig, fetch?: SimpleFetch) {
        if (fetch == null) {
            throw new Error('Missing "fetch" function.');
        }

        this.config = config;
        this.fetch = fetch;
    }

    get Master(): PSCBoundClient {
        if (this._Master == null) {
            this._Master = new PSCBoundClient(this, PSC.USE_MASTER_KEY);

        }
        return this._Master
    }

    login(username: string, password: string): Promise<PSCBoundClient> {
        var url = `${this.config.url}/login`;

        return this.request('GET', url, { username: username.toLowerCase(), password }, null)
            .then(data => new PSCBoundClient(this, data.sessionToken));
    }

    query<T>(className: string, sessionToken: SessionToken): PSCQuery<T> {
        return PSCQuery.query<T>(this, sessionToken, className)
    }

    runQuery<T>(query: PSCQuery<T>, sessionToken: SessionToken): Promise<T[]> {
        const url = `${this.config.url}/classes/${query.className}`;

        return this.request('GET', url, query.toJSON(), sessionToken).then(res => res.results)
    }

    run<T>(functionName: string, args: any, sessionToken: SessionToken): Promise<T> {
        const url = `${this.config.url}/functions/${functionName}`;

        return this.request('POST', url, args, sessionToken);
    }

    save<T>(className: string, data: any, sessionToken: SessionToken) {
        var url = `${this.config.url}/classes/${className}`
        var method = 'POST';
        if (data.objectId != null) {
            url = `${url}/${data.objectId}`;
            method = 'PUT';
        }

        return this.request(method, url, data, sessionToken);
    }

    request(method: string, url: string, data: Object, sessionToken: SessionToken): Promise<any> {
        var requestBody: ParseRequestBody = {
            _ApplicationId: this.config.applicationId,
            _method: method
        };

        if (sessionToken === PSC.USE_MASTER_KEY) {
            if (this.config.masterKey == null) {
                throw new Error('Unable to run masterKey request without masterKey');
            }

            requestBody._MasterKey = this.config.masterKey;
        } else if (sessionToken != null) {
            requestBody._SessionToken = sessionToken;
        }

        Object.keys(data).forEach(k => requestBody[k] = data[k]);

        return this.fetch(url, {
            method: 'POST',
            headers: HEADERS,
            body: JSON.stringify(requestBody)
        }).then(res => {
            const contentType = res.headers.get('content-type') || '';
            if (contentType.indexOf(HEADER_CONTENT_JSON) === -1) {
                return Promise.reject(res);
            }

            const json = res.json();
            if (res.ok) { // Status >= 200 & < 300
                return json;
            }

            return json.then(j => Promise.reject(j));
        });
    }
}

export class PSCQuery<T> {
    public className: string;
    sessionToken: SessionToken;
    queryLimit: number = 1000;
    where = {};
    psc: PSC;

    constructor(psc: PSC, sessionToken: SessionToken, className: string) {
        this.className = className;
        this.sessionToken = sessionToken;
        this.psc = psc;
    }

    static query<T>(psc: PSC, sessionToken: SessionToken, className: string): PSCQuery<T> {
        return new PSCQuery(psc, sessionToken, className);
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
        return this.psc.runQuery(this, this.sessionToken);
    }

    first(): Promise<T> {
        this.limit(1);
        return this.psc.runQuery(this, this.sessionToken).then(objects => objects[0]);
    }

    toJSON() {
        return {
            limit: this.queryLimit,
            where: this.where
        }
    }
}

export default PSC;
