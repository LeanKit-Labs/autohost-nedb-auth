var _ = require( 'lodash' ),
	should = require( 'should' ),
	when = require( 'when' ),
	seq = require( 'when/sequence' ),
	pipe = require( 'when/pipeline' ),
	actions = require( '../src/nedb/actions.js' ),
	api = require( '../src/index.js' )();

describe( 'when working with actions', function() {

	var masterList = {
			'one': [ 'one.a', 'one.b' ],
			'two': [ 'two.a', 'two.b' ]
		},
		modifiedList = {
			'one': [ 'one.c', 'one.b' ],
			'two': [ 'two.a', 'two.c' ]	
		};

	before( function( done ) {
		api.updateActions( masterList )
			.then( null, function( err ) {
				console.log( err );
			} )
			.then( function() {
				done();
			} );
	} );

	it( 'should create 4 actions', function( done ) {
		actions.getList()
			.then( null, function( err ) {
				console.log( err );
			} )
			.then( function( list ) {
				list.length.should.equal( 4 );
				done();
			} );
	} );

	describe( 'when updating action list', function() {
		var actionList;

		before( function( done ) {
			seq( [
				function() { return api.updateActions( modifiedList ); },
				function() { return actions.getList(); }
				] )
			.then( null, function( err ) {
				console.log( err.stack );
			} )
			.then( function( list ) {
				actionList = list[ 1 ];
				done();
			} );
		} );

		it( 'should have a aggregate of 6 actions', function() {
			var expected =[
				'one.a', 
				'one.b', 
				'one.c',
				'two.a',
				'two.b',
				'two.c', 
			];
			expected.should.eql( _.map( actionList, 'name' ) );
		} );

	} );

	describe( 'when changing an action\'s roles', function() {
		var roles;

		before( function( done ) {
			seq( [
				function() { return actions.changeRoles( 'one.a', [ 'r1', 'r2', 'r3', 'r4' ], 'add' ); },
				function() { return actions.changeRoles( 'one.a', [ 'r6', 'r2', 'r4', 'r5' ], 'add' ); },
				function() { return actions.changeRoles( 'one.a', [ 'r3', 'r1', 'r5' ], 'remove' ); },
				function() { return actions.getRoles( 'one.a' ); }
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


	describe( 'when removing all actions', function() {
		before( function( done ) {
			var actionList =[
				'one.a', 
				'one.b', 
				'one.c',
				'two.a',
				'two.b',
				'two.c', 
			];
			var deletes = _.map( actionList, function( actionname ) {
				return actions.delete( actionname );
			} );
			when.all( deletes )
				.then( function() {
					done();
				} );
		} );

		it( 'should report no actions', function( done ) {
			actions.getList()
				.then( function( x ) {
					x.should.eql( [] );
					done();
				} );
		} );
	} );
} );