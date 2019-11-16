#Shell para iniciar la red Helpchain

function _exit(){
    printf "Saliendo:%s\n" "$1"
    exit -1
}


# Exit on first error, print all commands.
set -ev
set -o pipefail

# ¿Donde estoy?
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." && pwd )"

cd "${DIR}/../redhelpchain/"


docker kill cliReg cliSHC cliUsr || true

./helpchain.sh up || _exit " Error al iniciar red HelpChain"
