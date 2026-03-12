#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LAB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$SCRIPT_DIR"

COMPOSE_FILE="$SCRIPT_DIR/compose.yml"
ENV_FILE="$SCRIPT_DIR/.env"
SCHEMA_FILE="$LAB_ROOT/db/schema.sql"

echo "--------------------------------------"
echo "Starting Oracle LiveLab Environment"
echo "--------------------------------------"

#Load environment variables
if [ -f .env ]; then
export $(grep -v '^#' .env | xargs)
fi

echo ""
echo "Cleaning previous environment..."

podman-compose -f "$COMPOSE_FILE" down --remove-orphans

echo ""
echo "Building containers..."

podman-compose -f "$COMPOSE_FILE" build

echo ""
echo "Starting Oracle container..."

podman-compose -f "$COMPOSE_FILE" up -d

echo ""
echo "Waiting for Oracle database to initialize..."

until podman logs oracle-free 2>&1 | grep -q "DATABASE IS READY TO USE"
do
    echo "Database not ready yet..."
    sleep 10
done

echo "Database ready."

echo ""
echo "Copying initialization script..."

podman cp ../db/schema.sql oracle-free:/tmp/schema.sql

echo ""
echo "Running initialization script..."

podman exec oracle-free bash -c "
sqlplus / as sysdba <<EOF
ALTER SESSION SET CONTAINER=FREEPDB1;
@/tmp/schema.sql
exit;
EOF
"

echo ""
echo "--------------------------------------"
echo "Environment Ready"
echo "--------------------------------------"

echo ""
echo "Connect with:"
echo "podman exec -it oracle-free bash"
echo "sqlplus lab/lab@FREEPDB1"
