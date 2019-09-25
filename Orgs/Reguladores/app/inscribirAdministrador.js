'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/

var Fabric_Client = require('fabric-client');
var Fabric_CA_Client = require('fabric-ca-client');

var fs = require('fs');
var path = require('path');

var redhelpchain_path = path.resolve('../..', '../..', 'redhelpchain');             //Aqui tengo que cambiar dependiendo de la organizacion
var org1tlscacert_path = path.resolve(redhelpchain_path, 'crypto-config', 'peerOrganizations', 'org1.example.com', 'tlsca', 'tlsca.org1.example.com-cert.pem');
var org1tlscacert = fs.readFileSync(org1tlscacert_path, 'utf8');

//
var fabric_client = new Fabric_Client();
var fabric_ca_client = null;
var admin_user = null;
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
    	trustedRoots: [org1tlscacert],                                                                            //Aqui tengo que cambiar dependiendo de la organizacion
    	verify: false
    };
    // be sure to change the http to https when the CA is running TLS enabled
    fabric_ca_client = new Fabric_CA_Client('https://localhost:7054', tlsOptions , 'ca-org1', crypto_suite);    //Aqui tengo que cambiar dependiendo de la organizacion

    return fabric_client.getUserContext('admin', true);
}).then((user_from_store) => {
    if (user_from_store && user_from_store.isEnrolled()) {
        console.log('Los datos del administrador han sido cargados correctamente');
        admin_user = user_from_store;
        return null;
    } else {
        return fabric_ca_client.enroll({
          enrollmentID: 'admin',
          enrollmentSecret: 'adminpw'
        }).then((enrollment) => {
          console.log('Se ha inscrito correctamente el usuario administrador "admin"');
          return fabric_client.createUser(
              {username: 'admin',
                  mspid: 'Org1MSP',                                                                             //Aqui tengo que cambiar dependiendo de la organizacion
                  cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
              });
        }).then((user) => {
          admin_user = user;
          return fabric_client.setUserContext(admin_user);
        }).catch((err) => {
          console.error('Fallo al inscribir o cargar datos del administrador. Error: ' + err.stack ? err.stack : err);
          throw new Error('Error al inscribir administrador');
        });
    }
}).then(() => {
    console.log('Usuario administrador asignado al cliente Fabric de la red Helpchain ::' + admin_user.toString());
}).catch((err) => {
    console.error('Error no se pudo inscribir admin: ' + err);
});
