## autohost nedb auth provider
This library complies with autohost v0.2.0's auth provider specification. It provides all optional features so it should work well with the auth dashboard built into autohost.

This library currently supports basic, OAuth2 (bearer) and generic token authorization headers. If no authorization header is present, a basic challenge is present.

### usage
```js
var autohost = require( 'autohost' ),
	auth = require( 'autohost-nedb-auth' )( {} );
var host = autohost( { authProvider: authProvider } );
```

### config
The only real option here is setting `noSession` to true which will disable the session in the supported passport strategies.
