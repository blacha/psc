export const Schema = [{
    "_id": "FakeObject",
    "objectId": "string",
    "updatedAt": "string",
    "createdAt": "string",
    "name": "string",
    "ary": "array",
    "obj": "object"
}, {
    "_id": "_Role",
    "name": "string",
    "roles": "relation\u003c_Role\u003e",
    "users": "relation\u003c_User\u003e",
    "ACL": "object"
}, {
    "_id": "_Session",
    "restricted": "boolean",
    "expiresAt": "date",
    "createdWith": "map",
    "user": "*_User",
    "installationId": "string",
    "sessionToken": "string"
}, {
    "_id": "_User",
    "username": "string",
    "email": "string",
    "emailVerified": "boolean",
    "password": "string"
}]

export default Schema;
