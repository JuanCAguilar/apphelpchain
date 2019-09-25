'use strict';
/*
* Copyright IBM Corp All Rights Reserved
*
* SPDX-License-Identifier: Apache-2.0
*/
/*
 * Chaincode Invoke
 */

const Fabric_Client = require('fabric-client');
const fs = require('fs');
const path = require('path');
const util = require('util');

var redhelpchain_path = path.resolve('../..', '../..', 'redhelpchain');             //Aqui tengo que cambiar dependiendo de la organizacion
var org1tlscacert_path = path.resolve(firstnetwork_path, 'crypto-config', 'peerOrganizations', 'org1.example.com', 'tlsca', 'tlsca.org1.example.com-cert.pem');
var org1tlscacert = fs.readFileSync(org1tlscacert_path, 'utf8');

invoke();

async function invoke() {
	console.log('\n\n ========= Iniciando (((invoke.js))) =============');
	try {
		console.log('Configurando los objetos de la red del lado del cliente');
		const fabric_client = new Fabric_Client();
		const channel = fabric_client.newChannel('channelhelpchain');
		console.log('Creado el objeto para representar al canal');
		const peer = fabric_client.newPeer('grpcs://localhost:7051', {
			'ssl-target-name-override': 'peer0.org1.example.com',					             //Aqui tengo que cambiar dependiendo de la organizacion
			pem: org1tlscacert
		});
		console.log('Creado el objeto para representar al peer solicitado');


		const wallet_path = path.join(__dirname, 'hfc-key-store');
		console.log('Configurando Wallet path: '+wallet_path);
		const state_store = await Fabric_Client.newDefaultKeyValueStore({ path: wallet_path});
		fabric_client.setStateStore(state_store);
		const crypto_suite = Fabric_Client.newCryptoSuite();
		const crypto_store = Fabric_Client.newCryptoKeyStore({path: wallet_path});
		crypto_suite.setCryptoKeyStore(crypto_store);
		fabric_client.setCryptoSuite(crypto_suite);


		const user = await fabric_client.getUserContext('user1', true);			             //Aqui tengo que cambiar dependiendo de la organizacion
		if (user && user.isEnrolled()) {
			console.log('Los datos del usuario han sido cargados correctamente');		  	             //Aqui tengo que cambiar dependiendo de la organizacion
		} else {
			throw new Error('\n\n Error buscando al usuario.... ejecuta registrarUsuario.js');		             //Aqui tengo que cambiar dependiendo de la organizacion
		}

		console.log('Configuracion del lado del cliente lista');

		await channel.initialize({ discover: true, asLocalhost: true, target: peer });
		console.log('\n\nIniciando el proceso de invocacion');



		const tx_id = fabric_client.newTransactionID();
		console.log(util.format("\nCreando ID de la transaccion: %s", tx_id.getTransactionID()));



		const proposal_request = {
			targets: [peer], // notice the proposal_request has the peer defined in the 'targets' attribute
			chaincodeId: 'helpchain',
			fcn: 'crearProyecto',																																					//PARTE IMPORTANTE: FUNCION Y ARGUMENTOS POR DEFINIR
			args: ['CAR12', 'Honda', 'Accord', 'Black', 'Tom'],
			chainId: 'channelhelpchain',
			txId: tx_id
		};


		const endorsement_results = await channel.sendTransactionProposal(proposal_request);
		const proposalResponses = endorsement_results[0];
		const proposal = endorsement_results[1];

		if (proposalResponses[0] instanceof Error) {
			console.error('Error al enviar la propuesta. Se recibio un error :: ' + proposalResponses[0].toString());
			throw proposalResponses[0];
		} else if (proposalResponses[0].response && proposalResponses[0].response.status === 200) {
			console.log(util.format(
				'Se ha enviado la propuesta y recibido la respuesta correctamente: Status - %s',
				proposalResponses[0].response.status));
		} else {
			const error_message = util.format('Invoke chaincode proposal:: %j', proposalResponses[i]);
			console.error(error_message);
			throw new Error(error_message);
		}


		const commit_request = {
			proposalResponses: proposalResponses,
			proposal: proposal
		};
		const transaction_id_string = tx_id.getTransactionID();
		const promises = [];
		const sendPromise = channel.sendTransaction(commit_request);
		promises.push(sendPromise);
		let event_hub = channel.newChannelEventHub(peer);
		let txPromise = new Promise((resolve, reject) => {
			let handle = setTimeout(() => {
				event_hub.unregisterTxEvent(transaction_id_string);
				event_hub.disconnect();
				resolve({event_status : 'TIMEOUT'});
			}, 30000);


			event_hub.registerTxEvent(transaction_id_string, (tx, code) => {
				clearTimeout(handle);

				const return_status = {event_status : code, tx_id : transaction_id_string};
				if (code !== 'VALID') {
					console.error('La transaccion ha sido invalida = ' + code);
					resolve(return_status);
				} else {
					console.log('La transaccion ha sido realizada en el peer' + event_hub.getPeerAddr());
					resolve(return_status);
				}
			}, (err) => {
				reject(new Error('Problema en event_hub ::'+err));
			},
				{disconnect: true} //disconnect when complete
			);

			// now that we have a protective timer running and the listener registered,
			// have the event hub instance connect with the peer's event service
			event_hub.connect();
			console.log('Escuchador de transacciones registrado para peer event service con el ID de transaccion:'+ transaction_id_string);
		});


		promises.push(txPromise);
		console.log('Enviando transaccion endosada al ordenador');
		const results = await Promise.all(promises);

		// since we added the orderer work first, that will be the first result on
		// the list of results
		// success from the orderer only means that it has accepted the transaction
		// you must check the event status or the ledger to if the transaction was
		// committed
		if (results[0].status === 'SUCCESS') {
			console.log('Transaccion enviada correctamente al ordenador');
		} else {
			const message = util.format('Fallo al ordenar la transaccion. Error code: %s', results[0].status);
			console.error(message);
			throw new Error(message);
		}

		if (results[1] instanceof Error) {
			console.error(message);
			throw new Error(message);
		} else if (results[1].event_status === 'VALID') {
			console.log('Se ha cometido el cambio al ledger de forma exitosa por el peer');
			console.log('\n\n - Intenta correr "node query.js" para ver los resultados');
		} else {
			const message = util.format('Error al cometer el cambio en el ledger: %s', results[1].event_status)
			console.error(message);
			throw new Error(message);
		}
	} catch(error) {
		console.log('No fue posible la invocacion ::'+ error.toString());
	}
	console.log('\n\n ========= Fin de (((invoke.js))) =============');
};
