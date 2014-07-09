var _ = require( 'lodash' ),
	path = require( 'path' ),
	nedb = require( 'nedb' ),
	when = require( 'when' ),
	nodeWhen = require( 'when/node' ),
	config = require( 'configya' )( './config.json' ),
	Datastore = require( 'nedb' );

var usersPath = path.join( config.get( 'data.path', '../data' ), 'users.db' );
var rolesPath = path.join( config.get( 'data.path', '../data' ), 'roles.db' );
var actionsPath = path.join( config.get( 'data.path', '../data' ), 'actions.db' );
var pathsPath = path.join( config.get( 'data.path', '../data' ), 'paths.db' );

var users = wrap( new Datastore( { filename: usersPath, autoload: true } ) );
var roles = wrap( new Datastore( { filename: rolesPath, autoload: true } ) );
var actions = wrap( new Datastore( { filename: actionsPath, autoload: true } ) );
var paths = wrap( new Datastore( { filename: pathsPath, autoload: true } ) );

function wrap( db ) {
	return {
		raw: db,
		count: nodeWhen.lift( db.count ).bind( db ),
		find: 	nodeWhen.lift( db.find ).bind( db ),
		insert: nodeWhen.lift( db.insert).bind( db ),
		remove: nodeWhen.lift( db.remove ).bind( db ),
		update: nodeWhen.lift( db.update ).bind( db )
	};
}

function count( db, pattern ) {
	return db.count( pattern );
}

function purge( db, key, all ) {
	return db.remove( key, { multi: all } );
}

function fetch( db, pattern, map ) {
	var map = map || function( x ) { return x; },
		apply = function( list ) { return _.map( list, map ); };
	return when.try( apply, db.find( pattern ) );
}

function fetchPage( db, pattern, map, continuation ) {
	var pages = continuation.page - 1,
		skipCount = pages * continuation.limit,
		map = map || function( x ) { return x; },
		apply = function( list ) {
			return _.map( list, map ); 
		},
		op = db.raw.find( pattern ).skip( skipCount ).limit( continuation.limit ),
		promise = nodeWhen.apply( op.exec.bind( op ) );
	return when.try( apply, promise )
				.then( function( data ) {
					data.continuation = continuation;
					data.continuation.page ++;
					return data;
				} )
				.then( null, function( e ) {
					console.log( e.stack );
				} )
				.catch( function( e ) {
					console.log( e.stack );
				} );
}

function insert( db, doc ) {
	return db.insert( doc );
}

function update( db, pattern, change ) {
	return db.update( pattern, change, {} );
}

function upsert( db, pattern, doc ) {
	return db.update( pattern, doc, { upsert: true } );
}


function addUserRoles( user, roles ) {
	return update( users, { username: user }, { $addToSet: { roles: { $each: roles } } } );
}

function addActionRoles( action, roles ) {
	return update( actions, { name: action }, { $addToSet: { roles: { $each: roles } } } );
}

function checkPermission( user, action ) {
	var effectiveRoles = user.disabled ? [] : user.roles,
		userRoles = user.roles ? effectiveRoles : getUserRoles( user ),
		actionRoles = action.roles ? action.roles : getActionRoles( action );
	return when.try( userCan, userRoles, actionRoles );
}

function createRole( role ) {
	return insert( roles, { name: role } );
}

function createUser( user, salt, hash ) {
	return upsert( users, { username: user }, { username: user, salt: salt, hash: hash, roles: [] } );
}

function disableUser( user ) {
	return update( users, { username: user }, { $set: { disabled: true } } );
}

function enableUser( user ) {
	return update( users, { username: user }, { $set: { disabled: false } } );
}

function getActions() {
	return fetch( actions, {} );
}

function getActionList( continuation ) {
	return fetchPage( actions, {}, undefined, continuation );
}

function getActionRoles( action ) {
	return fetch( actions, { name: action }, function( x ) {
		return x.roles;
	} )
	.then( function( matches ) {
		return matches[ 0 ];
	} );
}

function getRoleList( continuation ) {
	return fetchPage( roles, {}, undefined, continuation );
}

function getUser( user ) {
	return fetch( users, { username: user } );
}

function getUserList( continuation ) {
	return fetchPage( users, {}, undefined, continuation );
}

function getUserRoles( user ) {
	return fetch( users, { username: user }, function( x ) {
		return x.disabled ? [] : x.roles;
	} )
	.then( function( matches ) {
		return matches[ 0 ];
	} );
}

function removeActionRoles( action, roles ) {
	return update( actions, { name: action }, { $pull: { roles: roles } } );
}

function removeAll() {
	return when.all( [
		purge( users, {}, true ),
		purge( actions, {}, true ),
		purge( roles, {}, true )
	] );
}

function removeRole( role ) {
	return db.remove( roles, { name: role } );
}

function removeUserRoles( user, roles ) {
	return update( users, { username: user }, { $pull: { roles: roles } } );
}

function userCount() {
	return count( users, {} );
}

function updateActions( list ) {
	return when.all( _.map( list, function( action ) {
		return upsert( actions, { name: action.name, resource: action.resource }, { name: action.name, resource: action.resource, roles: [] } );
	} ) );
}

function userRoles( user ) {
	return fetch( users, { username: user } )
		.then( function( list ) {
			var user = list[ 0 ];
			return user.disabled ? [] : user.roles;
		} );
}

function userCan( userRoles, actionRoles ) {
	return _.intersection( actionRoles, userRoles ).length > 0;
}

module.exports = function( done ) {
	userCount().then( function( count ) { done( count > 0 ); } );
	return {
		addActionRoles: addActionRoles,
		addRole: createRole,
		addUserRoles: addUserRoles,
		checkPermission: checkPermission,
		createUser: createUser,
		disableUser: disableUser,
		enableUser: enableUser,
		getActionList: getActionList,
		getActionRoles: getActionRoles,
		getRoleList: getRoleList,
		getUserRoles: getUserRoles,
		getUserByName: getUser,
		getUserList: getUserList,
		removeActionRoles: removeActionRoles,
		removeRole: removeRole,
		removeUserRoles: removeUserRoles,
		updateActions: updateActions,
		userCount: userCount,
		removeAll: removeAll
	};
}