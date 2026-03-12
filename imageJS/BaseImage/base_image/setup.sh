#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$SCRIPT_DIR/notebooks"

#bash "$SCRIPT_DIR/init/bootstrap.sh"

SETUP_FLAG="/var/tmp/livelabs_setup_complete"

if [ -f "$SETUP_FLAG" ]; then
echo ""
echo "System setup already completed. Skipping dependency installation."
else
echo ""
echo "Updating system packages..."

#######    S T A R T      S C R I P T    ######
#######   (this is for Oracle Linux 9)   ######

## update
sudo dnf update -y

## set firewall rules
sudo firewall-cmd --permanent --add-port=1521/tcp #Database
#sudo firewall-cmd --permanent --add-port=1522/tcp #Database
sudo firewall-cmd --permanent --add-port=8888/tcp #JupyterLabs
#sudo firewall-cmd --permanent --add-port=8181/tcp #ORDS
sudo firewall-cmd --permanent --add-port=8501/tcp #Streamlit
#sudo firewall-cmd --permanent --add-port=8502/tcp #Streamlit
#sudo firewall-cmd --permanent --add-port=8503/tcp #Streamlit
#sudo firewall-cmd --permanent --add-port=8504/tcp #Streamlit
#sudo firewall-cmd --permanent --add-port=8505/tcp #Streamlit
#sudo firewall-cmd --permanent --add-port=5000/tcp #Flask
#sudo firewall-cmd --permanent --add-port=5500/tcp #EM
#sudo firewall-cmd --permanent --add-port=5501/tcp #EM
#sudo firewall-cmd --permanent --add-port=7000/tcp #Django
#sudo firewall-cmd --permanent --add-port=27017/tcp #Mongo
#sudo firewall-cmd --permanent --add-port=8085/tcp #Sping1
#sudo firewall-cmd --permanent --add-port=8086/tcp #Sprin2
#sudo firewall-cmd --permanent --add-port=8087/tcp #Sprin3
#sudo firewall-cmd --permanent --add-port=8088/tcp #Sprin4
sudo firewall-cmd --permanent --add-rich-rule='rule family="ipv4" destination address="10.0.0.0/24" service name="ssh" accept'
sudo firewall-cmd --reload

sudo /usr/libexec/oci-growfs -y

#podman and utensils - https://docs.oracle.com/en/operating-systems/oracle-linux/podman/podman-InstallingPodmanandRelatedUtilities.html
sudo dnf install -y oracle-epel-release-el9
sudo dnf config-manager --enable ol9_developer_EPEL
sudo dnf install -y container-tools sqlcl jdk21 wget git 
sudo dnf install -y podman-compose
sudo dnf -y install oraclelinux-developer-release-el9
sudo dnf -y install python39-oci-cli python3.9-pip
# sudo dnf -y install maven

sudo dnf install -y python3.11 python3.11-pip

sudo pip3.11 install oracledb dotenv

sudo pip3.11 install --upgrade podman-compose

#set up user and group for podman
sudo loginctl enable-linger 'opc'
sudo setsebool -P container_manage_cgroup on

#echo "alias check='watch systemctl --user status user-podman.service'" >> ~/.bash_profile
#echo "alias stopp='systemctl --user stop user-podman.service'" >> ~/.bash_profile
#echo "alias cleanup='systemctl --user stop user-podman.service && rm -rf compose2cloud/ ; rm -rf .config/systemd/user/ ; rm -rf .oci ; podman stop jupyterlab ; podman stop demo ; buildah rm --all ; podman system prune --all --force ;rm -rf ~/tmp ; systemctl --user daemon-reload'" >> ~/.bash_profile

#source ~/.bash_profile.sh


## Ley - edit later
#wget -O firstboot.sh https://c4u04.objectstorage.us-ashburn-1.oci.customer-oci.com/p/i-WDpQq_yUvSxLbfCPfYNyvCFyz6Rv7gvQaBPTHeUlvjpPSN_Hvh5_Zyk7pMXWlu/n/c4u04/b/bootstrap/o/firstboot.sh
#sudo bash /home/opc/firstboot.sh
#chmod +x /home/opc/firstboot.sh
#sudo ln -sf /home/opc/firstboot.sh /var/lib/cloud/scripts/per-instance/firstboot.sh
#sudo /var/lib/cloud/scripts/per-instance/firstboot.sh

## load variables (scripts, passwords, etc)
# source /home/opc/init/variable.sh
# chmod +x /home/opc/init/*.sh

## create the compose script folder and files
#mkdir -p /home/opc/.config/systemd/user

##############################################
#### U P D A T E      U R L              ####
##############################################
## update the url to build.zip - Ley 
################################################ 
## this should point to the custom service file for your workshop
# create a build zip in the proect root folder imagebuild/<project>/: zip -r build.zip *
#wget -O /home/opc/build.zip "https://c4u04.objectstorage.us-ashburn-1.oci.customer-oci.com/p/i-WDpQq_yUvSxLbfCPfYNyvCFyz6Rv7gvQaBPTHeUlvjpPSN_Hvh5_Zyk7pMXWlu/n/c4u04/b/bootstrap/o/aidataplatform/build.zip"
#unzip -oq /home/opc/build.zip -d /home/opc/ && rm /home/opc/build.zip
#cp /home/opc/composescript/scripts/user-podman.service /home/opc/.config/systemd/user/.
##########
##########

#sudo systemctl daemon-reload
#export XDG_RUNTIME_DIR=/run/user/$UID
#systemctl --user daemon-reload
#systemctl --user enable user-podman
#systemctl --user start user-podman

fi

echo ""
echo "Starting lab initialization..."

#chmod -R 775 "$SCRIPT_DIR/notebooks"


# Make bootstrap executable
chmod +x "$SCRIPT_DIR/init/bootstrap.sh"

# Run bootstrap
bash "$SCRIPT_DIR/init/bootstrap.sh"

PUBLIC_IP=$(curl -s ifconfig.me)

echo ""
echo "Lab environment ready"
echo "Streamlit UI : http://$PUBLIC_IP:8501"
echo "Jupyter Lab  : http://$PUBLIC_IP:8888"

#######    E N D      S C R I P T    ######
