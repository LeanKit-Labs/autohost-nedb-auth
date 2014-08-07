var roles = require( './db.js' )( 'roles.db' );

function create( rolename ) {
	return roles.upsert( { name: rolename }, { name: rolename } );
}

function getList( continuation ) {
	continuation.sort = continuation.sort || { name: 1 };
	return roles.fetch( {}, undefined, continuation );
}

function purge( rolename ) {
	return roles.purge( { name: rolename } );
}

module.exports = {
	create: create,
	delete: purge,
	getList: getList
}