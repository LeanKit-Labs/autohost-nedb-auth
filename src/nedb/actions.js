var actions = require( './db.js' )( 'actions.db' );

function changeRoles( actionname, roles, verb ) {
	var mutation = {},
		op = verb === 'add' ? '$addToSet' : '$pull',
		comp = verb === 'add' ? '$each' : '$in',
		command = { roles: {} };
	command.roles[ comp ] = roles;
	mutation[ op ] = command;
	return actions.update( { name: actionname }, mutation );
}

function create( actionname, resource ) {
	return actions.upsert( { name: actionname }, { $set: { name: actionname, resource: resource } } );
}

function getList( continuation ) {
	continuation = continuation || { sort: { name: 1 } };
	continuation.sort = continuation.sort || { name: 1 };
	return actions.fetch( {}, undefined, continuation );
}

function getRoles( actionname ) {
	return actions.fetch( { name: actionname }, function( x ) {
		return x.roles;
	} )
		.then( function( list ) {
			return list.length ? list[ 0 ] : [];
		} );
}

function purge( actionname ) {
	return actions.purge( { name: actionname } );
}

module.exports = {
	changeRoles: changeRoles,
	create: create,
	'delete': purge,
	getList: getList,
	getRoles: getRoles
};
