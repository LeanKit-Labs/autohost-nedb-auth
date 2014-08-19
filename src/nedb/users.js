var _ = require( 'lodash' ),
	users = require( './db.js' )( 'users.db' );

function changePassword( username, salt, hash ) {
	return users.update( { name: username }, { $set: { salt: salt, hash: hash } } );
}

function changeRoles( username, roles, verb ) {
	var mutation = {};
	var op = verb === 'add' ? '$addToSet' : '$pull';
	var comp = verb === 'add' ? '$each' : '$in';
	var command = { roles: {} };
	command.roles[ comp ] = roles;
	mutation[ op ] = command;
	return users.update( { name: username }, mutation );
}

function createToken( username, token ) {
	return users.update( { name: username }, { $addToSet: { tokens: token } } );
}

function create( username, salt, hash ) {
	return users.upsert( { name: username }, { name: username, salt: salt, hash: hash, roles: [], tokens: [] } );
}

function purge( username ) {
	return users.purge( { name: username } );
}

function destroyToken( username, token ) {
	return users.update( { name: username }, { $pull: { tokens: token } } );
}

function disable( username ) {
	return users.update( { name: username }, { $set: { disabled: true } } );
}

function enable( username ) {
	return users.update( { name: username }, { $set: { disabled: false } } );
}

function getByName( username ) {
	return users.fetch( { name: username } )
		.then( function( list ) {
			return list.length ? list[ 0 ] : undefined;
		} );
}

function getByToken( token ) {
	return users.fetch( { tokens: token } )
		.then( function( list ) {
			return list.length ? list[ 0 ] : undefined;
		} );
}

function getList( continuation ) {
	continuation = continuation || { sort: { name: 1 } };
	continuation.sort = continuation.sort || { name: 1 };
	return users.fetch( {}, undefined, continuation )
		.then( function( list ) {
			var filtered = _.map( list, function( user ) {
				return _.omit( user, 'tokens', 'hash', 'salt' );
			} );
			filtered.continuation = list.continuation;
			return filtered;
		} );
}

function getRoles( username ) {
	return users.fetch( { name: username }, function( x ) { return x.disabled ? [] : x.roles; } )
		.then( function( list ) {
			return list.length ? list[ 0 ] : [];
		} );
}

function getTokens( username ) {
	return users.fetch( { name: username }, function( x ) { return x.tokens; } )
		.then( function( list ) {
			return list.length ? list[ 0 ] : [];
		} );
}

function hasUsers() {
	return users.count().then( function( count ) { return count > 0; } );
}

module.exports = {
	create: create,
	changePassword: changePassword,
	changeRoles: changeRoles,
	createToken: createToken,
	'delete': purge,
	destroyToken: destroyToken,
	disable: disable,
	enable: enable,
	getByName: getByName,
	getByToken: getByToken,
	getList: getList,
	getRoles: getRoles,
	getTokens: getTokens,
	hasUsers: hasUsers	
};