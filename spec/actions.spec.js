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
			expected.should.eql( _.map( actionList, function( a ) { return a.name; } ) );
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