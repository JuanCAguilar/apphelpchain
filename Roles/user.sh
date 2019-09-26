#Ejecución de cliente para Reguladores de HelpChain

# ¿Donde estoy?
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

cd "${DIR}/Orgs/UsuarioHC/cliconfig"
docker-compose -f docker-compose.yml up -d cliUsr
