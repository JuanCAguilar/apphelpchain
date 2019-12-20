'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode query
 */

var Fabric_Client = require('fabric-client');
var fs = require('fs');
var path = require('path');

var redhelpchain_path = path.resolve('../..', '../..', 'redhelpchain');             //Aqui tengo que cambiar dependiendo de la organizacion
var regtlscacert_path = path.resolve(redhelpchain_path, 'crypto-config', 'peerOrganizations', 'reg.com', 'tlsca', 'tlsca.reg.com-cert.pem');
var regtlscacert = fs.readFileSync(regtlscacert_path, 'utf8');

//
var fabric_client = new Fabric_Client();


var channel = fabric_client.newChannel('channelhelpchain');
var peer = fabric_client.newPeer('grpcs://localhost:7051', {
	'ssl-target-name-override': 'peer0.reg.com',		 //Aqui tengo que cambiar dependiendo de la organizacion
	pem: regtlscacert
});
channel.addPeer(peer);
var store_path = path.join(__dirname, 'hfc-key-store');
console.log('Store path:'+store_path);


Fabric_Client.newDefaultKeyValueStore({ path: store_path
}).then((state_store) => {
	fabric_client.setStateStore(state_store);
	var crypto_suite = Fabric_Client.newCryptoSuite();
	var crypto_store = Fabric_Client.newCryptoKeyStore({path: store_path});
	crypto_suite.setCryptoKeyStore(crypto_store);
	fabric_client.setCryptoSuite(crypto_suite);

	return fabric_client.getUserContext('user1', true);
}).then((user_from_store) => {
	if (user_from_store && user_from_store.isEnrolled()) {
		console.log('Los datos del usuario han sido cargados correctamente');
	} else {
		throw new Error('run..	node registrarUsuario.js');
	}


//	buscarProyecto		nomP
//	queryProyectsPorCausa		causa
//	queryProyectsPorTipoSol 	tipoSol
//	queryProyectsPorNomSol		nomSol		--FALLO
//	queryProyectsPorEstadoP		estadoP
//	queryProyectsPorEstadoCad 	estadoCad

	const request = {
		chaincodeId: 'helpchain',
		fcn: 'buscarProyecto',				//PARTE IMPORTANTE
		args: ['proyecto1']
	};

	// send the query proposal to the peer
	return channel.queryByChaincode(request);
}).then((query_responses) => {
	console.log("El Query ha sido realizado. Viendo resultados");
	if (query_responses && query_responses.length == 1) {
		if (query_responses[0] instanceof Error) {
			console.error("error en query = ", query_responses[0]);
		} else {
			console.log("La respuesta es:  ", query_responses[0].toString());
		}
	} else {
		console.log("No ha devuelto nada el query");
	}
}).catch((err) => {
	console.error('Error al realizar el query correctamente :: ' + err);
});
