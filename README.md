##Como utilizar la app de HelpChain

Ejecutar
`./Control/IniciarRedHelpChain.sh`




```
docker exec cliReg peer chaincode install -n helpchain -v 0 -p /opt/gopath/src/github.com/contract -l node

docker exec cliReg peer chaincode instantiate -n helpchain -v 0 -l node -c '{"Args":["org.example.contract:instantiate"]}' -C channelhelpchain -P "AND ('Org1MSP.member')"
```


*HelpChain*
