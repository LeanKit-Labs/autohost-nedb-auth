var users = require( './db.js' )( 'users.db' );

function changePassword( username, salt, hash ) {
	return users.update( { username: username }, { $set: { salt: salt, hash: hash } } );
}

function changeRoles( username, roles, verb ) {
	var mutation = {},
		op = verb === 'add' ? '$addToSet' : '$pull',
		comp = verb === 'add' ? '$each' : '$in',
		command = { roles: {} };
	command.roles[ comp ] = roles;
	mutation[ op ] = command;
	return users.update( { username: username }, mutation );
}

function createToken( username, token ) {
	return users.update( { username: username }, { $addToSet: { tokens: token } } );
}

function create( username, salt, hash ) {
	return users.upsert( { username: username }, { username: username, salt: salt, hash: hash, roles: [], tokens: [] } );
}

function purge( username ) {
	return users.purge( { username: username } );
}

function destroyToken( username, token ) {
	return users.update( { username: username }, { $pull: { tokens: token } } );
}

function disable( username ) {
	return users.update( { username: username }, { $set: { disabled: true } } );
}

function enable( username ) {
	return users.update( { username: username }, { $set: { disabled: false } } );
}

function getByName( username ) {
	return users.fetch( { username: username } )
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
	continuation = continuation || { sort: { username: 1 } };
	continuation.sort = continuation.sort || { username: 1 };
	return users.fetch( {}, undefined, continuation );
}

function getRoles( username ) {
	return users.fetch( { username: username }, function( x ) { return x.roles; } )
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
	hasUsers: hasUsers	
};