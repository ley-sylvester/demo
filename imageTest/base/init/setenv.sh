#! /bin/bash
set -euo pipefail
# This script prepares the environment variables (.env) for each app container

# source the variable file
source /home/opc/init/variable.sh

#set to your fav name
export APP_TYPE=aidata_dev_vscode_privai

export POD_ROOT=/home/opc/ingestion/
APP_DIR="$POD_ROOT/app/lab/$APP_TYPE"
COMPOSE_ENV="$POD_ROOT/.env"

# Ensure the target app directory exists before writing runtime files.
mkdir -p "$APP_DIR"

# Workshop variables

echo "Checking for workshop package…"

echo "Downloading workshop files from ${workshopfiles}"

TMP_ZIP="/tmp/workshop_bundle.zip"

if curl -fL "${workshopfiles}" -o "$TMP_ZIP"; then
    mkdir -p /home/opc/ingestion
    unzip -oq "$TMP_ZIP" -d /home/opc/ingestion
    rm -f "$TMP_ZIP"
    echo "Workshop files installed under /home/opc/ingestion."
else
    echo "Failed to download workshop bundle from ${workshopfiles}" >&2
fi


# clean up existing things
sudo rm -rf /home/opc/.oci


# Compose variable interpolation for DB/ORDS containers.
ORACLE_PWD_VALUE="${DBPASSWORD:-${ORACLE_PWD:-}}"
if [[ -z "${ORACLE_PWD_VALUE}" ]]; then
  echo "DBPASSWORD and ORACLE_PWD are empty; cannot start DB/ORDS containers."
  exit 1
fi
DB_USER_VALUE="${DB_USER:-hub_user}"
DB_PASSWORD_VALUE="${DB_PASSWORD:-${ORACLE_PWD_VALUE}}"

printf 'ORACLE_PWD=%s\n' "${ORACLE_PWD_VALUE}" > "${COMPOSE_ENV}"
printf 'APP_DB_ADMIN_PWD=%s\n' "${ORACLE_PWD_VALUE}" >> "${COMPOSE_ENV}"
printf 'DB_USER=%s\n' "${DB_USER_VALUE}" >> "${COMPOSE_ENV}"
printf 'DB_PASSWORD=%s\n' "${DB_PASSWORD_VALUE}" >> "${COMPOSE_ENV}"
chmod 600 "${COMPOSE_ENV}"


# Tighten app permissions: owner-access only.
chmod -R u=rwX,go= "$POD_ROOT/app/"


#JupyterLab default settings
# mkdir -p $POD_ROOT/app/lab/$APP_TYPE/.jupyter
# cp -r $POD_ROOT/jl_config/* $POD_ROOT/app/lab/$APP_TYPE/.jupyter