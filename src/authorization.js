var when = require( 'when' ),
	_ = require( 'lodash' );
module.exports = function( nedb ) {
	var provider = {
		actionList: function( list ) {
			return nedb.updateActions( list );
		},
		checkPermission: function( user, action ) {
			return nedb.checkPermission( user, action );
		},
		getUserRoles: function( userName ) {
			return nedb.getUserRoles( userName );
		},
		getRolesFor: function( actionName ) {
			return nedb.getActionRoles( actionName );
		},
		getUserList: function() {
			var limit, continuation;
			if( _.isNumber( arguments[ 0 ] ) ) {
				limit = arguments[ 0 ];
			} else if ( _.isObject( arguments[ 0 ] ) ) {
				continuation = arguments[ 0 ];
			}
			if( !continuation ) {
				continuation = {
					limit: limit || 10,
					page: 1
				};
			}
			return nedb.getUserList( continuation );
		},
		getActionList: function() {
			var limit, continuation;
			if( _.isNumber( arguments[ 0 ] ) ) {
				limit = arguments[ 0 ];
			} else if ( _.isObject( arguments[ 0 ] ) ) {
				continuation = arguments[ 0 ];
			}
			if( !continuation ) {
				continuation = {
					limit: limit || 10,
					page: 1
				};
			}
			return nedb.getActionList( continuation );
		},
		getRoleList: function() {
			var limit, continuation;
			if( _.isNumber( arguments[ 0 ] ) ) {
				limit = arguments[ 0 ];
			} else if ( _.isObject( arguments[ 0 ] ) ) {
				continuation = arguments[ 0 ];
			}
			if( !continuation ) {
				continuation = {
					limit: limit || 10,
					page: 1
				};
			}
			return nedb.getRoleList( continuation );
		},
		addActionRoles: function( action, roles ) {
			return nedb.addActionRoles( action, roles );
		},
		removeActionRoles: function( action, roles ) {
			return nedb.removeActionRoles( action, roles );
		},
		addUserRoles: function( user, roles ) {
			return nedb.addUserRoles( user, roles );
		},
		removeUserRoles: function( user, roles ) {
			return nedb.removeUserRoles( user, roles );	
		},
		setActionRoles: function( action, roles ) {
			return nedb.addActionRoles( action, roles );
		},
		setUserRoles: function( user, roles ) {
			return nedb.addUserRoles( user, roles );
		},
		addRole: function( role ) {
			return nedb.addRole( role );
		},
		removeRole: function( role ) {
			return nedb.removeRole( role );
		}
	};
	_.bindAll( provider );
	return provider;
};