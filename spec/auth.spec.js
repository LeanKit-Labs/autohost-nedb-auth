require( 'should' );
var _ = require( 'lodash' ),
	when = require( 'when' ),
	config = require( 'configya' )( './config.json' );

describe( 'with nedb setup', function() {
	var nedb, authorization, authentication;
	before( function( done ) {
		nedb = require( '../src/nedb.js' )( function() {
			authorization = require( '../src/authorization' )( nedb ),
			authentication = require( '../src/authentication' )( nedb );
			done();
		} );
	} );

	describe( 'when authenticating invalid credentials', function() {
		before( function( done ) {
			authentication.create( 'one', 'user' )
				.done( function() { done(); } );
		} );

		it( 'should reject', function( done ) {
			authentication.verify( 'terd', 'ferguson' )
				.then( null, function( err ) {
					( true == false ).should.be.true;
					done();
				} )
				.then( function( valid ) {
					valid.should.be.false;
					done();
				} );
		} );

		after( function( done ) {
			nedb.removeAll().then( function() { 
				done();
			});
		} );
	} );

	describe( 'when authenticating valid account', function() {
		before( function( done ) {
			authentication.create( 'ron.burgundy@newsteam.com', 'huginn munin' )
				.done( function() { done(); } );
		} );

		it( 'should reject incorrect password', function( done ) {
			authentication.verify( 'ron.burgundy@newsteam.com', 'foggy london town' )
				.then( null, function( err ) {
					( true == false ).should.be.true;
					done();
				} )
				.then( function( valid ) {
					valid.should.be.false;
					done();
				} );
		} );

		it( 'should accept correct password', function( done ) {
			authentication.verify( 'ron.burgundy@newsteam.com', 'huginn munin' )
				.then( null, function( err ) {
					( true == false ).should.be.true;
					done();
				} )
				.done( function( valid ) {
					valid.should.be.true;
					done();
				} );
		} );

		after( function( done ) {
			nedb.removeAll().then( function() { 
				done();
			});
		} );
	} );

	describe( 'when authorizing an account', function() {
		before( function( done ) {
			authorization.actionList( [ 
					{ name: 'add', resource: 'test' },
					{ name: 'update', resource: 'test' },
					{ name: 'delete', resource: 'test' },
					{ name: 'view', resource: 'test' } 
				] )
			.then( function() {
				when.all( [
					authorization.setActionRoles( 'add', [ 'privileged', 'super' ] ),
					authorization.setActionRoles( 'update', [ 'privileged', 'super' ] ),
					authorization.setActionRoles( 'delete', [ 'super' ] ),
					authorization.setActionRoles( 'view', [ 'any', 'privileged', 'super' ] )
					] )
				.then( check );
			} );

			var created = 0,
				check = function() {
					created++;
					if( created == 3 ) {
						done();
					}
				};

			authentication.create( 'user@app.com', 'password' )
				.done( function() {
					authorization.setUserRoles( 'user@app.com', [ 'any' ] ).then( check );
				} );
			
			authentication.create( 'admin@app.com', 'password' )
				.done( function() {
					authorization.setUserRoles( 'admin@app.com', [ 'super' ] ).then( check );
				} );
		} );

		it( 'should return user list', function( done ) {
			this.timeout( 10000 );
			authorization.getUserList()
				.catch( function( err ) {
					console.log( 'error', err );
				} )
				.then( null, function( err ) {
					console.log( 'fail', err );
				} )
				.then( function( list ) {
					done();
				} );
		} );

		it( 'should return action list', function( done ) {
			authorization.getActionList()
				.then( function( list ) {
					done();
				} );
		} );

		it( 'should show correct roles for view', function( done ) {
			authorization.getRolesFor( 'view' )
				.then( function( roles ) {
					roles.should.eql( [ 'any', 'privileged', 'super' ] );
					done();
				} );
		} );

		it( 'should show correct roles for user', function( done ) {
			authorization.getUserRoles( 'user@app.com' )
				.then( function( roles ) {
					roles.should.eql( [ 'any' ] );
					done();
				} );
		} );

		it( 'should show correct roles for admin', function( done ) {
			authorization.getUserRoles( 'admin@app.com' )
				.then( function( roles ) {
					roles.should.eql( [ 'super' ] );
					done();
				} );
		} );

		it( 'should authorize user for view', function( done ) {
			authorization.checkPermission( 'user@app.com', 'view' )
				.then( function( pass ) {
					pass.should.be.true;
					done();	
				} );
		} );

		it( 'should authorize based on cached objects', function( done ) {
			authorization.checkPermission( 
				{ roles: [ 'one', 'two', 'three' ] }, 
				{ roles: [ 'two' ] } )
				.then( function( pass ) {
					pass.should.be.true;
					done();
				} );
		} );

		it( 'should reject based on cached objects', function( done ) {
			authorization.checkPermission( 
				{ roles: [ 'one', 'two', 'three' ] }, 
				{ roles: [ 'four' ] } )
				.then( function( pass ) {
					pass.should.be.false;
					done();
				} );
		} );

		it( 'should reject based on cached disabled account', function( done ) {
			authorization.checkPermission(
				{ roles: [ 'one', 'two', 'three' ], disabled: true },
				{ roles: [ 'one' ] }
			).then( function( pass ) {
				pass.should.be.false;
				done();
			} );
		} );

		it( 'should reject based on disabled account', function( done ) {
			authentication.disable( 'user@app.com' )
				.then( null, function( err ) {
					( err == null ).should.be.true;
					done();
				} )
				.then( function() {
					authorization.checkPermission( 'user@app.com', 'view' )
					.then( function( pass ) {
						pass.should.be.false;
						done();
					} );
				} );
		} );

		it( 'should accept based on re-enabled account', function( done ) {
			authentication.enable( 'user@app.com' )
				.then( null, function( err ) {
					( err == null ).should.be.true;
					done();
				} )
				.then( function() {
					authorization.checkPermission( 'user@app.com', 'view' )
						.then( function( pass ) {
							pass.should.be.true;
							done();
						} );
				} );
		} );

		after( function( done ) {
			nedb.removeAll().then( function() { 
				done();
			});
		} );
	} );

	describe( 'with more than a page of items', function() {
		var users = [
				{ u: 'one', 	p: 'temp '},
				{ u: 'two', 	p: 'temp' },
				{ u: 'three', 	p: 'temp' },
				{ u: 'four', 	p: 'temp' },
				{ u: 'five', 	p: 'temp' },
				{ u: 'six', 	p: 'temp' },
				{ u: 'seven', 	p: 'temp' },
				{ u: 'eight', 	p: 'temp' },
				{ u: 'nine', 	p: 'temp' },
				{ u: 'ten', 	p: 'temp' }
		];
		before( function( done ) {
			var promises = _.map( users, function( user ) {
				return authentication.create( user.u, user.p );
			} );
			when.all( promises )
				.done( function() {
					done();
				} );
		} );

		describe( 'with first page retrieved', function() {
			var page1, page2, page3, page4, continuation;
			before( function( done ) {
				authorization.getUserList( 3 )
					.then( function( list ) {
						page1 = list;
						continuation = list.continuation;
						done();
					} );
			} );

			it( 'should get page 2', function( done ) {
				authorization.getUserList( continuation )
					.then( null, function( err ) {
						console.log( 'err getting page 2', err );
						done();
					} )
					.then( function( list ) {
						page2 = list;
						continuation = list.continuation;
						done();
					} )
					.done();
			} );

			it( 'should get page 3', function( done ) {
				authorization.getUserList( continuation )
					.then( null, function( err ) {
						console.log( 'err getting page 3', err );
					} )
					.then( function( list ) {
						page3 = list;
						continuation = list.continuation;
						done();
					} );
			} );

			it( 'should get page 4', function( done ) {
				authorization.getUserList( continuation )
					.then( null, function( err ) {
						console.log( 'err getting page 4', err );
					} )
					.then( function( list ) {
						page4 = list;
						continuation = list.continuation;
						done();
					} );
			} );

			it( 'should have gotten correct page sizes', function() {
				page1.length.should.equal( 3 );
				page2.length.should.equal( 3 );
				page3.length.should.equal( 3 );
				page4.length.should.equal( 1 );
			} );

			after( function( done ) {
			nedb.removeAll().then( function() { 
				done();
			});
		} );
		} );
	} );
} );