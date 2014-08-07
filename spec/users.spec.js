var _ = require( 'lodash' ),
	should = require( 'should' ),
	when = require( 'when' ),
	seq = require( 'when/sequence' ),
	pipe = require( 'when/pipeline' ),
	users = require( '../src/nedb/users.js' );

describe( 'when creating', function() {

	before( function( done ) {
		when.all( [
			users.create( 'userone', 'two', 'three' ),
			users.create( 'usertwo', 'two', 'three' ),
			users.create( 'userthree', 'two', 'three' ),
			users.create( 'userfour', 'two', 'three' ),
			users.create( 'userfive', 'two', 'three' ),
			users.create( 'usersix', 'two', 'three' ),
			users.create( 'userseven', 'two', 'three' ),
			users.create( 'usereight', 'two', 'three' ),
			users.create( 'usernine', 'two', 'three' ),
			] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function() {
				done();
			} );
	} );

	it( 'should create user', function( done ) {
		users.getByName( 'userone' )
			.then( function( user ) {
				user.username.should.equal( 'userone' );
				user.salt.should.equal( 'two' );
				user.hash.should.equal( 'three' );
				user.roles.should.eql( [] );
				user.tokens.should.eql( [] );
				should( user.disabled ).should.not.exist;
				done();
			} );
	} );

	describe( 'when changing password', function() {
		var user;

		before( function( done ) {
			seq( [
				function() { return users.changePassword( 'userone', 'four', 'five' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				user = x[ 1 ];
				done();
			} );
		} );

		it( 'should change password', function() {
			user.username.should.equal( 'userone' );
			user.salt.should.equal( 'four' );
			user.hash.should.equal( 'five' );
		} );

	} );

	describe( 'when creating tokens', function() {
		var user;

		before( function( done ) {
			seq( [
				function() { return users.createToken( 'userone', 'six' ); },
				function() { return users.createToken( 'userone', 'seven' ); },
				function() { return users.createToken( 'userone', 'eight' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				user = x[ 3 ];
				done();
			} );
		} );

		it( 'should add a token', function() {
			user.username.should.equal( 'userone' );
			user.tokens.should.eql( [ 'six', 'seven', 'eight' ] );
		} );

	} );

	describe( 'when destroying token', function() {
		var user;

		before( function( done ) {
			seq( [
				function() { return users.destroyToken( 'userone', 'seven' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				user = x[ 1 ];
				done();
			} );
		} );

		it( 'should remove only the destroyed token', function() {
			user.username.should.equal( 'userone' );
			user.tokens.should.eql( [ 'six', 'eight' ] );
		} );

	} );

	describe( 'when getting by token', function() {
		var user;

		before( function( done ) {
			users.getByToken( 'six' )
				.then( null, function( err ) {
					console.log( err.stack );
				} )
				.then( function( x ) {
					user = x;
					done();
				} );
		} );

		it( 'should add a token', function() {
			user.username.should.equal( 'userone' );
			user.tokens.should.eql( [ 'six', 'eight' ] );
		} );

	} );

	describe( 'when changing user roles', function() {
		var roles;

		before( function( done ) {
			seq( [
				function() { return users.changeRoles( 'userone', [ 'r1', 'r2', 'r3', 'r4' ], 'add' ); },
				function() { return users.changeRoles( 'userone', [ 'r6', 'r2', 'r4', 'r5' ], 'add' ); },
				function() { return users.changeRoles( 'userone', [ 'r3', 'r1', 'r5' ], 'remove' ); },
				function() { return users.getRoles( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err );
			} )
			.then( function( x ) {
				roles = x[ 3 ];
				done();
			} );
		} );

		it( 'should remove only the destroyed token', function() {
			roles.should.eql( [ 'r2', 'r4', 'r6' ] );
		} );

	} );

	describe( 'when disabling user', function() {
		var user;

		before( function( done ) {
			seq( [
				function() { return users.disable( 'userone' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				user = x[ 1 ];
				done();
			} );
		} );

		it( 'should remove only the destroyed token', function() {
			user.disabled.should.equal( true );
		} );

	} );

	describe( 'when enabling user', function() {
		var user;

		before( function( done ) {
			seq( [
				function() { return users.enable( 'userone' ); },
				function() { return users.getByName( 'userone' ); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( x ) {
				user = x[ 1 ];
				done();
			} );
		} );

		it( 'should remove only the destroyed token', function() {
			user.disabled.should.equal( false );
		} );

	} );

	describe( 'when checking for users', function() {
		var result;

		before( function( done ) {
			users.hasUsers()
				.then( function( x ) {
					result = x;
					done();
				} );
		} );

		it( 'should report true', function() {
			result.should.be.true
		} );
	} );

	describe( 'when paging through users', function() {
		var page1, page2, page3;

		before( function( done ) {
			pipe( [
				function( seed ) { return users.getList( seed ); },
				function( list ) { 
					page1 = list;
					return users.getList( list.continuation );
				},
				function( list ) { 
					page2 = list;
					return users.getList( list.continuation );
				}
				], { limit: 3 } )
			.then( function( list ) {
				page3 = list;
				done();
			} );
		} );

		it( 'should pull all 3 pages', function() {
			page1.length.should.equal( 3 );
			page2.length.should.equal( 3 );
			page3.length.should.equal( 3 );
		} );

		it( 'should result in all users fetched', function() {
			var userList =[
				'usereight',
				'userfive',
				'userfour',
				'usernine',
				'userone', 
				'userseven',
				'usersix',
				'userthree',
				'usertwo'
			];
			var getName = function( x ) { return x.username; };
			_.flatten( [
				_.map( page1, getName ),
				_.map( page2, getName ),
				_.map( page3, getName )
			] ).should.eql( userList );
		} );
	} );

	describe( 'when checking and no users', function() {
		before( function( done ) {
			var userList =[
				'userone', 
				'usertwo', 
				'userthree',
				'userfour',
				'userfive',
				'usersix', 
				'userseven',
				'usereight',
				'usernine' 
			];
			var deletes = _.map( userList, function( username ) {
				return users.delete( username );
			} );
			when.all( deletes )
				.then( function() {
					done();
				} );
		} );

		it( 'should report no users', function( done ) {
			users.hasUsers()
				.then( function( x ) {
					x.should.be.false;
					done();
				} );
		} );
	} );
} );