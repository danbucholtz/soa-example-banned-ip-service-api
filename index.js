var Q = require("q");

var utils = require("soa-example-core-utils");

var config = require("soa-example-service-config").config();

var redisUtil = require('soa-example-redis-util');

var whiteList = [];

var initializeWhiteList = function(){
	whiteList.push(config.authenticationServiceIp);
	whiteList.push(config.authorizationServiceIp);
	whiteList.push(config.bannedIpServiceIp);
	whiteList.push(config.loggingServiceIp);
	whiteList.push(config.userServiceIp);
}();

var isIpAddressWhiteListed = function(ipAddress){
	return (whiteList.indexOf(ipAddress) > -1);
};

var isIpAddressBanned = function(ipAddress){
	var deferred = Q.defer();

	if ( isIpAddressWhiteListed(ipAddress) ){
		deferred.resolve(false);
	}
	else{
		redisUtil.get("banned").then(function(bannedHosts){

			if ( bannedHosts && bannedHosts.length > 0 ){
				for ( var i = 0; i < bannedHosts.length; i++ ){
					var bannedHost = bannedHosts[i];
					if ( bannedHost.host == ipAddress ){
						deferred.resolve(true);
						return;
					}
				}
			}

			deferred.resolve(false);
		});
	}
	
	return deferred.promise;
};

var invalidBasicCredentials = function(ipAddress, username, password){
	var deferred = Q.defer();

	var url = utils.createBaseUrl(config.bannedIpServiceIp, config.bannedIpServicePort) + "/invalid";

	var toPost = {
		type : getBasicType(),
		ipAddress: ipAddress,
		username: username,
		password: password
	};

	utils.postJsonWithAccessToken(config.systemAccessToken, toPost, url).then(function(response){
		deferred.resolve(resolve);
	});

	return deferred.promise;
};

var invalidBearerCredentials = function(ipAddress, accessToken){
	var deferred = Q.defer();

	var url = utils.createBaseUrl(config.bannedIpServiceIp, config.bannedIpServicePort) + "/invalid";

	var toPost = {
		type : getBearerType(),
		ipAddress: ipAddress,
		accessToken: accessToken
	};

	utils.postJsonWithAccessToken(config.systemAccessToken, toPost, url).then(function(response){
		deferred.resolve(resolve);
	});

	return deferred.promise;
};

var getBasicType = function(){
	return "Basic";
};

var getBearerType = function(){
	return "Bearer";
};


module.exports = {
	isIpAddressBanned : isIpAddressBanned,
	isIpAddressWhiteListed: isIpAddressWhiteListed,
	invalidBasicCredentials: invalidBasicCredentials,
	invalidBearerCredentials: invalidBearerCredentials,
	getBasicType: getBasicType,
	getBearerType: getBearerType
}