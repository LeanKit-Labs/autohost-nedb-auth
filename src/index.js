var crypt = require( 'bcrypt' ),
	when = require( 'when' ),
	passport = require( 'passport' ),
	Basic = require( 'passport-http' ).BasicStrategy,
	Bearer = require( 'passport-http-bearer' ).Strategy,
	Token = require( './tokenStrategy' ),
	_ = require( 'lodash' ),
	actions = require( './nedb/actions.js' ),
	roles = require( './nedb/roles.js' ),
	users = require( './nedb/users.js' ),
	basicAuth,
	bearerAuth,
	tokenAuth;

var wrapper = {
	authenticate: authenticate,
	changeActionRoles: actions.changeRoles,
	changePassword: changePassword,
	changeUserRoles: users.changeRoles,
	checkPermission: checkPermission,
	createRole: roles.create,
	createUser: createUser,
	createToken: users.createToken,
	destroyToken: users.destroyToken,
	deserializeUser: deserializeUser,
	disableUser: users.disable,
	enableUser: users.enable,
	getActions: actions.getList,
	getActionRoles: actions.getRoles,
	getRoles: roles.getList,
	getUsers: users.getList,
	getUserRoles: users.getRoles,
	hasUsers: users.hasUsers,
	removeRole: roles.delete,
	serializeUser: serializeUser,
	strategies: [
		new Basic( authenticateCredentials ),
		new Bearer( authenticateToken ),
		new Token( authenticateToken )
	],
	updateActions: updateActions,
};

function authenticate( req, res, next ) {
	var authorization = req.headers.authorization;
	if( /Basic/i.test( authorization ) ) {
		basicAuth( req, res, next );
	}
	else if( req._query && req._query[ 'token' ] ) {
		queryAuth( req, res, next );
	} else {
		bearerAuth( req, res, next );
	}
}

function authenticateCredentials( userName, password, done ) {
	return users
		.getByName( username )
		.then( null, function( err ) {
			done( err );
		} )
		.then( function( users ) {
			var user = _.where( users, function( u ) {
				return u.hash === crypt.hashSync( password, u.salt );
			} );
			done( null, user ? user : false );
		} );
}

function authenticateToken( token, done ) {
	return users
		.getByToken( token )
		.then( null, function( err ) {
			done( err );
		} )
		.then( function( user ) {
			done( null, user || false );
		} );
}

function changePassword( username, password ) {
	var salt = crypt.genSaltSync( 10 ),
		hash = crypt.hashSync( password, salt );
	return users.changePassword( username, salt, hash );
}

function createUser( user, password ) {
	var salt = crypt.genSaltSync( 10 ),
		hash = crypt.hashSync( password, salt );
	return users.create( username, salt, hash );
}

function checkPermission( user, action ) {
	var userName = user.name ? user.name : user,
		userRoles = _.isEmpty( user.roles ) ? users.getRoles( userName ) : user.roles;
	return when.try( userCan, userRoles, actions.getRoles( action ) );
}

function deserializeUser( user, done ) { done( null, user); }

function serializeUser( user, done ) { done( null, user ); }

function updateActions( actionList ) {
	var list = _.flatten(
			_.map( actionList, function( resource, resourceName ) {
				return _.map( resource, function( action ) { 
					return actions.create( action, resourceName );
				} );
			} ) );
	return when.all( list );
}

function userCan( userRoles, actionRoles ) {
	return actionRoles.length == 0 || _.intersection( actionRoles, userRoles ).length > 0;
}

module.exports = function( config ) {
	var useSession = !( config == undefined ? false : config.noSession );
	basicAuth = passport.authenticate( 'basic', { session: useSession } );
	bearerAuth = passport.authenticate( 'bearer', { session: useSession } );
	tokenAuth = passport.authenticate( 'token', { session: useSession } );
	return wrapper;
};