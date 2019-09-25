'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Register and Enroll a user
 */

var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');

var fs = require('fs');
var path = require('path');

var redhelpchain_path = path.resolve('../..', '../..', 'redhelpchain');             //Aqui tengo que cambiar dependiendo de la organizacion
var org1tlscacert_path = path.resolve(firstnetwork_path, 'crypto-config', 'peerOrganizations', 'org1.example.com', 'tlsca', 'tlsca.org1.example.com-cert.pem');
var org1tlscacert = fs.readFileSync(org1tlscacert_path, 'utf8');

//
var fabric_client = new Fabric_Client();
var fabric_ca_client = null;
var admin_user = null;
var member_user = null;
var wallet_path = path.join(__dirname, 'hfc-key-store');
console.log(' Wallet path:'+wallet_path);


Fabric_Client.newDefaultKeyValueStore({ path: wallet_path
}).then((state_store) => {
    fabric_client.setStateStore(state_store);
    var crypto_suite = Fabric_Client.newCryptoSuite();
    var crypto_store = Fabric_Client.newCryptoKeyStore({path: wallet_path});
    crypto_suite.setCryptoKeyStore(crypto_store);
    fabric_client.setCryptoSuite(crypto_suite);
    var	tlsOptions = {
    	trustedRoots: [org1tlscacert],
    	verify: false
    };
    // be sure to change the http to https when the CA is running TLS enabled
    fabric_ca_client = new Fabric_CA_Client('https://localhost:7054', tlsOptions , 'ca-org1', crypto_suite);             //Aqui tengo que cambiar dependiendo de la organizacion


    return fabric_client.getUserContext('admin', true);
}).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Los datos del administrador han sido cargados correctamente');
        admin_user = user_from_store;
    } else {
        throw new Error('Error al conseguir el administrador.... ejecuta  node inscribirAdministrador.js');
    }


    return fabric_ca_client.register({enrollmentID: 'user1', affiliation: 'org1.department1',role: 'client'}, admin_user); //Aqui tengo que cambiar dependiendo de la organizacion
}).then((secret) => {
    console.log('El usuario1 ha sido registrado - secret:'+ secret);

    return fabric_ca_client.enroll({enrollmentID: 'user1', enrollmentSecret: secret}); //Aqui tengo que cambiar dependiendo de la organizacion
}).then((enrollment) => {
  console.log('El nuevo usuario ha sido inscrito correctamente: "user1" ');
  return fabric_client.createUser(
     {username: 'user1',            //Aqui tengo que cambiar dependiendo de la organizacion
     mspid: 'Org1MSP',
     cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
     });
}).then((user) => {
     member_user = user;

     return fabric_client.setUserContext(member_user);
}).then(()=>{
     console.log('El usuario ha sido registrado e inscrito. Ya esta listo para interactuar con la red Helpchain.');

}).catch((err) => {
    console.error('Error al registrar: ' + err);
	if(err.toString().indexOf('Authorization') > -1) {
		console.error('Authorization failures may be caused by having admin credentials from a previous CA instance.\n' +
		'Try again after deleting the contents of the store directory '+wallet_path);
	}
});
