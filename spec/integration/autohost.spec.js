require( '../setup' );
var request = require( 'request' ).defaults( { jar: false } );
var autohost = require( 'autohost' );

describe( 'Autohost Integration', function() {
	var host;
	var auth = require( '../../src/index.js' )( {} );

	before( function( done ) {
		host = autohost( {
			authProvider: auth,
			port: 8898,
			resources: './spec/integration/resources'
		} );
		host.start();
		setTimeout( function() {
			auth.changeActionRoles( 'test.hi', [ 'user' ], 'add' );
			done();
		}, 200 );
	} );

	describe( 'with no users', function() {
		describe( 'when requesting access to an action with no role restriction', function() {
			var response;
			before( function( done ) {
				host.passport.resetUserCheck();
				request.get( {
					url: 'http://localhost:8898/api/test/anon'
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 203', function() {
				response.status.should.equal( 203 );
			} );

			it( 'should process request successfully', function() {
				response.body.should.equal( 'who are you?' );
			} );
		} );

		describe( 'when requesting access to an action with role restrictions', function() {
			var response;
			before( function( done ) {
				request.get( {
					url: 'http://localhost:8898/api/test/hi'
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 403', function() {
				response.status.should.equal( 403 );
			} );

			it( 'should reject request with inadquate permissions', function() {
				response.body.should.equal( 'User lacks sufficient permissions' );
			} );
		} );
	} );

	describe( 'with users', function() {

		before( function( done ) {
			when.all( [
				auth.createUser( 'user1', 'test' ),
				auth.createUser( 'user2', 'test' ),
				auth.changeUserRoles( 'user1', [ 'user' ], 'add' ),
				auth.createToken( 'user1', 'token' )
			] ).then( function() {
				host.passport.resetUserCheck();
				done();
			} );
		} );

		describe( 'with invalid credentials', function() {
			var response;
			before( function( done ) {
				request.get( {
					url: 'http://localhost:8898/api/test/hi',
					headers: {
						// authorization: 'Basic dXNlcjE6dGVzdA=='
						authorization: 'Basic dXNlcjE6dGVzdDE='
					}
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 401', function() {
				response.status.should.equal( 401 );
			} );

			it( 'should reject request with bad credentials', function() {
				response.body.should.equal( 'Unauthorized' );
			} );
		} );

		describe( 'when requesting access to an action with adequate permissions and credentials', function() {
			var response;
			before( function( done ) {
				request.get( {
					url: 'http://localhost:8898/api/test/hi',
					headers: {
						authorization: 'Basic dXNlcjE6dGVzdA=='
					}
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 200', function() {
				response.status.should.equal( 200 );
			} );
			it( 'should process request successfully', function() {
				response.body.should.equal( 'hello, user1!' );
			} );
		} );

		describe( 'when requesting access to an action with adequate permissions and token', function() {
			var response;
			before( function( done ) {
				request.get( {
					url: 'http://localhost:8898/api/test/hi',
					headers: {
						authorization: 'Bearer token'
					}
				}, function( err, resp ) {
						response = {
							body: resp.body,
							status: resp.statusCode
						};
						done();
					} );
			} );

			it( 'should respond with 200', function() {
				response.status.should.equal( 200 );
			} );
			it( 'should process request successfully', function() {
				response.body.should.equal( 'hello, user1!' );
			} );
		} );
	} );

	after( function() {
		fs.unlinkSync( './data/actions.db' );
		fs.unlinkSync( './data/roles.db' );
		fs.unlinkSync( './data/users.db' );
		host.stop();
	} );
} );
