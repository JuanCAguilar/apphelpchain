
'use strict';
const shim = require('fabric-shim');
const util = require('util');

let Chaincode = class {
  async Init(stub) {
    let ret = stub.getFunctionAndParameters();
    console.info(ret);
    console.info('=========== Instantiated HelpChain Chaincode ===========');
    return shim.success();
  }

  async Invoke(stub) {
    console.info('Transaction ID: ' + stub.getTxID());
    console.info(util.format('Args: %j', stub.getArgs()));

    let ret = stub.getFunctionAndParameters();
    console.info(ret);

    let method = this[ret.fcn];
    if (!method) {
      console.log('no function of name:' + ret.fcn + ' found');
      throw new Error('Received unknown function ' + ret.fcn + ' invocation');
    }
    try {
      let payload = await method(stub, ret.params, this);
      return shim.success(payload);
    } catch (err) {
      console.log(err);
      return shim.error(err);
    }
  }

  // ===============================================
  // crearProyecto
  // ===============================================
  async crearProyecto(stub, args, thisClass) {
    if (args.length != 7) {
      throw new Error('Incorrect number of arguments. Expecting 7');
    }
    // ==== Input sanitation ====
    console.info('######## Inicializando proyecto ########');
    if (args[0].length <= 0) {
      throw new Error('1st argument must be a non-empty string');
    }
    if (args[1].length <= 0) {
      throw new Error('2nd argument must be a non-empty string');
    }
    if (args[2].length <= 0) {
      throw new Error('3rd argument must be a non-empty string');
    }
    if (args[3].length <= 0) {
      throw new Error('4th argument must be a non-empty string');
    }
    if (args[4].length <= 0) {
      throw new Error('5th argument must be a non-empty string');
    }


    let nomP = args[0].toLowerCase();
    let tipoSol = args[1].toLowerCase();
    let nomSol = args[2].toLowerCase();
    let causa = args[3].toLowerCase();
    let montoMeta = parseInt(args[4]);
    if (typeof montoMeta !== 'number') {
      throw new Error('5th argument must be a numeric string');
    }



    // ==== Check if proyect already exists ====
    let proyState = await stub.getState(nomP);
    if (proyState.toString()) {
      throw new Error('This proyect already exists: ' + pID + ' ' +  nomP);
    }

    // ==== Create proyect object and marshal to JSON ====
    let proyect = {};
    proyect.docType = 'proyecto';
    proyect.nomP = nomP;
    proyect.nomSol = nomSol;
    proyect.tipoSol = tipoSol;
    proyecto.estadoP = 'EN_REVISION';
    proyecto.causa = causa;
    let cadena = {};
    let eslabonGenesis = {};
    eslabonGenesis.estadoCad = 'INACTIVO';
    eslabonGenesis.montoMeta = montoMeta;
    eslabonGenesis.numDonativos = 0;
    let donativos = {};
    eslabonGenesis.donativos = donativos;
    cadena.eslabonGenesis = eslabonGenesis;
    let eslabones = {};
    cadena.eslabones = eslabones;
    proyecto.cadena = cadena;


    // === Save proyect to state ===
    await stub.putState(nomP, Buffer.from(JSON.stringify(proyect)));
    let indexName = 'nomP~nomSol';
    let nomPnomSolIndexKey = await stub.createCompositeKey(indexName, [proyect.nomP, proyect.nomSol]);
    console.info(nomPnomSolIndexKey);
    //  Save index entry to state. Only the key name is needed, no need to store a duplicate copy of the proyect
    //  Note - passing a 'nil' value will effectively delete the key from state, therefore we pass null character as value
    await stub.putState(nomPnomSolIndexKey, Buffer.from('\u0000'));
    // ==== Marble saved and indexed. Return success ====
    console.info('######## Proyecto inicializado correctamente. ########');
  }

  // ===============================================
  // readProyect - read a proyect from chaincode state
  // ===============================================
  async readProyect(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Numero de argumentos incorrecto. Escribe el nombre del proyecto para realizar el query');
    }

    let name = args[0];
    if (!name) {
      throw new Error('El nombre no puede ser vacio');
    }
    let proyectAsbytes = await stub.getState(name); //get the proyect from chaincode state
    if (!proyectAsbytes.toString()) {
      let jsonResp = {};
      jsonResp.Error = 'El proyecto no existe: ' + name;
      throw new Error(JSON.stringify(jsonResp));
    }
    console.info('=======================================');
    console.log(proyectAsbytes.toString());
    console.info('=======================================');
    return proyectAsbytes;
  }

  // ==================================================
  // delete - remove a proyect key/value pair from state
  // ==================================================
  async deleteProyect(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Numero de argumentos incorrecto. Escribe el nombre del proyecto para eliminar');
    }
    let name = args[0];
    if (!name) {
      throw new Error('El nombre no puede ser vacio');
    }


    let valAsbytes = await stub.getState(name);
    let jsonResp = {};
    if (!valAsbytes) {
      jsonResp.error = 'El proyecto no existe: ' + name;
      throw new Error(jsonResp);
    }
    let proyectJSON = {};
    try {
      proyectJSON = JSON.parse(valAsbytes.toString());
    } catch (err) {
      jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + marbleName;
      throw new Error(jsonResp);
    }

    await stub.deleteState(name);

    // delete the index
    let indexName = 'nomP~nomSol';
    let nomPnomSolIndexKey = stub.createCompositeKey(indexName, [proyectJSON.nomP, proyectJSON.nomSol]);
    if (!nomPnomSolIndexKey) {
      throw new Error(' Failed to create the createCompositeKey');
    }
    //  Delete index entry to state.
    await stub.deleteState(nomPnomSolIndexKey);
  }

  // ===========================================================
  // Valida un proyecto poniendo el estadoP = Valida
  // ===========================================================
  async validarProyecto(stub, args, thisClass) {
    if (args.length != 1) {
      throw new Error('Numero de argumentos incorrecto. Escribe el nombre del proyecto para eliminar');
    }
    let name = args[0];
    if (!name) {
      throw new Error('El nombre no puede ser vacio');
    }

    let nomP = args[0];
    console.info('=======Comienza Validacion=========', nomP);

    let proyectAsBytes = await stub.getState(nomP);
    if (!proyectAsBytes || !proyectAsBytes.toString()) {
      throw new Error('Proyect does not exist');
    }
    let proyectToValid = {};
    try {
      proyectToValid = JSON.parse(proyectAsBytes.toString()); //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + nomP;
      throw new Error(jsonResp);
    }
    console.info(proyectToValid);
    proyectToValid.estadoP = 'VALIDA'';

    let proyectJSONasBytes = Buffer.from(JSON.stringify(proyectToValid));
    await stub.putState(nomP, proyectJSONasBytes); //rewrite the marble

    console.info('========Validacion Exitosa===========');
  }

  // =======================================================================================
  // Activa un proyecto poniendo el estadoP = Activo, estadoCad = VERDE y parametros de Meta
  // =======================================================================================
  async activarProyecto(stub, args, thisClass) {
    //   0       1   2      3     4   5
    // 'name', DPE,  PPE,   DE,   PE, NE
    if (args.length < 6) {
      throw new Error('Numero incorrecto de argumentos. Se esperaba nombre del proyecto, duracion primer eslabon, porcentaje primer eslabon, duracion eslabon, porcentaje eslabon y numero de eslabones')
    }

    let nomP = args[0];
    let dpe = parseInt(args[1]);
    if (typeof dpe !== 'number') {
      throw new Error('2th argument must be a numeric string');
    }
    let ppe = parseInt(args[2]);
    if (typeof ppe !== 'number') {
      throw new Error('3th argument must be a numeric string');
    }
    let de = parseInt(args[3]);
    if (typeof de !== 'number') {
      throw new Error('4th argument must be a numeric string');
    }
    let pe = parseInt(args[4]);
    if (typeof pe !== 'number') {
      throw new Error('5th argument must be a numeric string');
    }
    let ne = parseInt(args[5]);
    if (typeof ne !== 'number') {
      throw new Error('6th argument must be a numeric string');
    }


    console.info('================Comienza activacion de proyecto=================', nomP);

    let proyectAsBytes = await stub.getState(nomP);
    if (!proyectAsBytes || !proyectAsBytes.toString()) {
      throw new Error('Proyect does not exist');
    }
    let proyectToActivate = {};
    try {
      proyectToActivate = JSON.parse(proyectAsBytes.toString()); //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + nomP;
      throw new Error(jsonResp);
    }
    console.info(proyectToActivate);
    proyectToActivate.estadoP = 'ACTIVA';
    proyectToActivate.cadena.eslabonGenesis.estadoCad = 'VERDE';


    let cadenaAux = {};
    cadenaAux.eslabonGenesis = proyectToActivate.cadena.eslabonGenesis;

    let eslabones={};
    if(ne == 2){
      let eslabon1 = {};
      eslabon1.duracion = dpe;
      eslabon1.metaPEs = ((cadenaAux.eslabonGenesis.montoMeta)*(ppe))/100;
      eslabon1.recaudacion = 0;
      let eslabon2 = {};
      eslabon2.duracion = de;
      eslabon2.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon2.recaudacion = 0;

      eslabones.eslabon1 = eslabon1;
      eslabones.eslabon2 = esladon2;
    }
    if(ne == 3){
      let eslabon1 = {};
      eslabon1.duracion = dpe;
      eslabon1.metaPEs = ((cadenaAux.eslabonGenesis.montoMeta)*(ppe))/100;
      eslabon1.recaudacion = 0;
      let eslabon2 = {};
      eslabon2.duracion = de;
      eslabon2.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon2.recaudacion = 0;
      let eslabon3 = {};
      eslabon3.duracion = de;
      eslabon3.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon3.recaudacion = 0;


      eslabones.eslabon1 = eslabon1;
      eslabones.eslabon2 = esladon2;
      eslabones.eslabon3 = esladon3;
    }
    if(ne == 4){
      let eslabon1 = {};
      eslabon1.duracion = dpe;
      eslabon1.metaPEs = ((cadenaAux.eslabonGenesis.montoMeta)*(ppe))/100;
      eslabon1.recaudacion = 0;
      let eslabon2 = {};
      eslabon2.duracion = de;
      eslabon2.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon2.recaudacion = 0;
      let eslabon3 = {};
      eslabon3.duracion = de;
      eslabon3.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon3.recaudacion = 0;
      let eslabon4 = {};
      eslabon4.duracion = de;
      eslabon4.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon4.recaudacion = 0;


      eslabones.eslabon1 = eslabon1;
      eslabones.eslabon2 = esladon2;
      eslabones.eslabon3 = esladon3;
      eslabones.eslabon4 = esladon4;
    }
    if(ne == 5){
      let eslabon1 = {};
      eslabon1.duracion = dpe;
      eslabon1.metaPEs = ((cadenaAux.eslabonGenesis.montoMeta)*(ppe))/100;
      eslabon1.recaudacion = 0;
      let eslabon2 = {};
      eslabon2.duracion = de;
      eslabon2.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon2.recaudacion = 0;
      let eslabon3 = {};
      eslabon3.duracion = de;
      eslabon3.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon3.recaudacion = 0;
      let eslabon4 = {};
      eslabon4.duracion = de;
      eslabon4.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon4.recaudacion = 0;
      let eslabon5 = {};
      eslabon5.duracion = de;
      eslabon5.metaEs = ((cadenaAux.eslabonGenesis.montoMeta)*(pe))/100;
      eslabon5.recaudacion = 0;


      eslabones.eslabon1 = eslabon1;
      eslabones.eslabon2 = esladon2;
      eslabones.eslabon3 = esladon3;
      eslabones.eslabon4 = esladon4;
      eslabones.eslabon5 = esladon5;
    }

    cadenaAux.eslabones = eslabones;
    proyectToActivate.cadena = cadenaAux;



    let proyectJSONasBytes = Buffer.from(JSON.stringify(proyectToActivate));
    await stub.putState(nomP, proyectJSONasBytes); //rewrite the marble

    console.info('================Activacion de proyecto exitosa=================');
  }


  async crearDonativo(stub, args, thisClass) {
    //   0       1          2
    //  nomP   nomD    Cantidad
    if (args.length < 3) {
      throw new Error('Numero incorrecto de argumentos. Se esperaba nombre del proyecto, nombre del donador y cantidad a donar')
    }

    let nomP = args[0];
    let nomD = args[1];
    let cantidad = parseInt(args[2]);
    if (typeof cantidad !== 'number') {
      throw new Error('3th argument must be a numeric string');
    }


    console.info('================Comienza la creacion del donativo =================');

    let proyectAsBytes = await stub.getState(nomP);
    if (!proyectAsBytes || !proyectAsBytes.toString()) {
      throw new Error('Proyect does not exist');
    }
    let proyectToDonate = {};
    try {
      proyectToDonate = JSON.parse(proyectAsBytes.toString()); //unmarshal
    } catch (err) {
      let jsonResp = {};
      jsonResp.error = 'Failed to decode JSON of: ' + nomP;
      throw new Error(jsonResp);
    }
    console.info(proyectToDonate);

    let numDonativos = proyectToDonate.cadena.eslabonGenesis.numDonativos + 1;
    proyectToDonate.cadena.eslabonGenesis.numDonativos = numDonativos;
    proyectToDonate.cadena.eslabonGenesis.eslabones.eslabon1.recaudacion = proyectToDonate.cadena.eslabonGenesis.eslabones.eslabon1.recaudacion + cantidad
    let donativosAux = {};
    donativosAux = proyectToDonate.cadena.eslabonGenesis.donativos;

    let don = 'don'+numDonativos.toString();
    donativosAux[don] = {
      dID: 'd'+numDonativos.toString()+nomD,
      nomD: nomD,
      cantidad: cantidad,
      estado: 'ASIGNADO'
    }

    proyectToDonate.cadena.eslabonGenesis.donativos = donativosAux;



    let proyectJSONasBytes = Buffer.from(JSON.stringify(proyectToDonate));
    await stub.putState(nomP, proyectJSONasBytes);

    console.info('================Activacion de proyecto exitosa=================');
  }




/////////////////////////////////// SECCION DE QUERIES //////////////////////////////////////


  async getProyectsPorRango(stub, args, thisClass) {

    if (args.length < 2) {
      throw new Error('Incorrect number of arguments. Expecting 2');
    }

    let startKey = args[0];
    let endKey = args[1];

    let resultsIterator = await stub.getStateByRange(startKey, endKey);
    let method = thisClass['getAllResults'];
    let results = await method(resultsIterator, false);

    return Buffer.from(JSON.stringify(results));
  }


  async queryProyectsPorCausa(stub, args, thisClass) {
    //   0
    // 'DESASTRES'
    if (args.length < 1) {
      throw new Error('Numero incorrecto de argumentos. Se espera una causa.')
    }

    let causa = args[0].toLowerCase();
    let queryString = {};
    queryString.selector = {};
    queryString.selector.docType = 'marble';
    queryString.selector.causa = causa;
    let method = thisClass['getQueryResultForQueryString'];
    let queryResults = await method(stub, JSON.stringify(queryString), thisClass);
    return queryResults; //shim.success(queryResults);
  }

  async queryProyectsPorTipoSol(stub, args, thisClass) {
    //   0
    // 'Organizacion'
    if (args.length < 1) {
      throw new Error('Numero incorrecto de argumentos. Se espera un tipo de solicitante.')
    }

    let tipoSol = args[0].toLowerCase();
    let queryString = {};
    queryString.selector = {};
    queryString.selector.docType = 'marble';
    queryString.selector.tipoSol = tipoSol;
    let method = thisClass['getQueryResultForQueryString'];
    let queryResults = await method(stub, JSON.stringify(queryString), thisClass);
    return queryResults; //shim.success(queryResults);
  }

  async queryProyectsPorNomSol(stub, args, thisClass) {

    if (args.length != 1) {
      throw new Error('Numero de argumentos incorrecto. Escribe el nombre del solicitante');
    }
    let nomSol = args[0].toLowerCase();
    if (!nomSol) {
      throw new Error('El nombre no puede ser vacio');
    }

    console.info('======== Empieza queryProyectsBasedOnNomSol ========== ', nomSol);


    let nomSolProyectsResultsIterator = await stub.getStateByPartialCompositeKey('nomP~nomSol', [nomSol]);


    let method = thisClass['getAllResults'];
    let results = await method(resultsIterator, false);

    return Buffer.from(JSON.stringify(results));
  }

  async queryProyectsPorEstadoP(stub, args, thisClass) {
    //   0
    // 'VALIDO'
    if (args.length < 1) {
      throw new Error('Numero incorrecto de argumentos. Se espera un estado de Proyecto.')
    }

    let estadoP = args[0].toLowerCase();
    let queryString = {};
    queryString.selector = {};
    queryString.selector.docType = 'marble';
    queryString.selector.estadoP = estadoP;
    let method = thisClass['getQueryResultForQueryString'];
    let queryResults = await method(stub, JSON.stringify(queryString), thisClass);
    return queryResults; //shim.success(queryResults);
  }

  async queryProyectsPorEstadoCad(stub, args, thisClass) {
    //   0
    // 'AMARILLO'
    if (args.length < 1) {
      throw new Error('Numero incorrecto de argumentos. Se espera un estado de Cadena.')
    }

    let estadoCad = args[0].toLowerCase();
    let queryString = {};
    queryString.selector = {};
    queryString.selector.docType = 'marble';
    queryString.selector.cadena.eslabonGenesis.estadoCad = estadoCad;
    let method = thisClass['getQueryResultForQueryString'];
    let queryResults = await method(stub, JSON.stringify(queryString), thisClass);
    return queryResults; //shim.success(queryResults);
  }


    async getAllResults(iterator, isHistory) {
      let allResults = [];
      while (true) {
        let res = await iterator.next();

        if (res.value && res.value.value.toString()) {
          let jsonRes = {};
          console.log(res.value.value.toString('utf8'));

          if (isHistory && isHistory === true) {
            jsonRes.TxId = res.value.tx_id;
            jsonRes.Timestamp = res.value.timestamp;
            jsonRes.IsDelete = res.value.is_delete.toString();
            try {
              jsonRes.Value = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
              console.log(err);
              jsonRes.Value = res.value.value.toString('utf8');
            }
          } else {
            jsonRes.Key = res.value.key;
            try {
              jsonRes.Record = JSON.parse(res.value.value.toString('utf8'));
            } catch (err) {
              console.log(err);
              jsonRes.Record = res.value.value.toString('utf8');
            }
          }
          allResults.push(jsonRes);
        }
        if (res.done) {
          console.log('end of data');
          await iterator.close();
          console.info(allResults);
          return allResults;
        }
      }
    }

    // =========================================================================================
    // getQueryResultForQueryString executes the passed in query string.
    // Result set is built and returned as a byte array containing the JSON results.
    // =========================================================================================

    async getQueryResultForQueryString(stub, queryString, thisClass) {

      console.info('- getQueryResultForQueryString queryString:\n' + queryString)
      let resultsIterator = await stub.getQueryResult(queryString);
      let method = thisClass['getAllResults'];

      let results = await method(resultsIterator, false);

      return Buffer.from(JSON.stringify(results));
    }

    async getHistoryPorProyecto(stub, args, thisClass) {

      if (args.length < 1) {
        throw new Error('Numero incorrecto de argumentos. Esperando nombre de proyecto')
      }
      let nomP = args[0];
      console.info('- start getHistoryForMarble: %s\n', nomP);

      let resultsIterator = await stub.getHistoryForKey(nomP);
      let method = thisClass['getAllResults'];
      let results = await method(resultsIterator, true);

      return Buffer.from(JSON.stringify(results));
    }

  };

  shim.start(new Chaincode());
