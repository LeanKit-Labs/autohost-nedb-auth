var crypt = require( 'bcrypt' ),
	when = require( 'when' ),
	_ = require( 'lodash' );

module.exports = function( nedb ) {
	var usersExist = undefined,
		countPromise = function() {
			return nedb.userCount()
				.then( function( count ) { 
					usersExist = count > 0;
					return usersExist; 
				} );
		},
		hasUsers = function() {
			return usersExist ? when( usersExist ) : countPromise();
		};
	return {
		create: function( username, password, done ) {
			var salt = crypt.genSaltSync(10);
 			var hash = crypt.hashSync(password, salt);
			return nedb.createUser( username, salt, hash );
		},
		disable: function( username, done ) {
			return nedb.disableUser( username );
		},
		enable: function( username, done ) {
			return nedb.enableUser( username );
		},
		hasUsers: hasUsers,
		verify: function( username, password, done ) {
			return nedb
				.getUserByName( username )
				.then( function( users ) {
					return users.length > 0 ?
						users[ 0 ].hash == crypt.hashSync( password, users[ 0 ].salt ) :
						false;
				} );
		}
	};
};