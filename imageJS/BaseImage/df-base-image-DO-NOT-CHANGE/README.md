# Demo Factory Base Image - Minimum

COPY THIS THE WHOLE FOLDER and start building a new image
This is as example of a base image that can be used to build a new image.
DO NOT CHANGE

## Project Overview

**Purpose:** Automate setup and deployment of a fully functional LiveLabs workshop base image used for Demo Factory

**Technology Stack:**
- Container Runtime: Podman/Podman Compose
- Base OS: Oracle Linux 9
- Ingestion directory
---

## Directory Structure

```
df-base-image/
├── .env.min                   # Example for minum .env - copy to compute and rename to .env
├── inst.sh                    # Entry point: VM setup script. Copy to compute instance
├── build_dev.zip              # Packaged build artifacts. Needs to be rebuild every time config changes. Copy to compute instance
├── README.md                  # User documentation
│
├── ingestion/             # Container orchestration. user can place their whole compose stack in this directory. This includes at a minumum a comppose.yml plus additional files required to create the container environment.
│   ├── compose.yml            # Main Podman Compose definition
│   ├── Dockerfile1             # Dockerfile for the container environment
│   ├── Dockerfile2             # Dockerfile for the container environment
│   ├── add-on_scripts/
│   │   └── entrypoint.sh      # Demo container startup script
│   ├── seeder.sql             # SQL seeder script
│   ├── dbsetup.sql            # SQL script to setup database
├── init/                      # Bootstrap scripts. Review setenv.sh and enable env variables required.
│   ├── setenv.sh              # Generate .env files
│   ├── variable.sh            # Resolve vars from OCI metadata
│   └── user-podman.service    # Systemd service for auto-start

```
---

## Bootstrap Workflow

Execution order when provisioning a new VM:

```
1. inst.sh (manual)          → Install packages, configure firewall, setup Podman, unzipd build_dev.zip
2. systemd starts bootstrap  → Triggers init scripts automatically
   ├── setenv.sh             → Generate environment configs (sources variable.sh)
   ├── user-podman.service   → Systemd service for auto-start

```

---

## Key Files Reference

### Entry Points
| File | Description |
|------|-------------|
| `inst.sh` | Run first on fresh OCI VM - installs all dependencies |



## Environment Variables

Required variables (set in `.env` or via OCI metadata):

### OCI Credentials
- `pem_key` - Private key content
- `user_ocid` - OCI user OCID
- `tenancy_ocid` - Tenancy OCID
- `compartment_ocid` - Compartment OCID
- `adb_ocid` - Autonomous Database OCID

### Database
- `dbconnection` - Full connection string
- `dbpassword` - Database password
- `dbname` - Database name
- `SERVICE_NAME` - Oracle service name
- `ordsurl` - ORDS endpoint URL

### External Services
- `mongodbapi` - MongoDB API endpoint
- `graphurl` - Oracle Graph endpoint
- `ai_endpoint_region` - OCI AI service region

---


## Managing Services
```bash
# Check status
systemctl --user status user-podman

# Restart containers
systemctl --user restart user-podman

# Stop service
systemctl --user restart user-podman

# View logs
podman-compose -f /home/opc/ingestion/compose.yml logs -f
```

---
