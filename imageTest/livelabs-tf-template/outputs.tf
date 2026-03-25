/*
********************
# Copyright (c) 2025 Oracle and/or its affiliates. All rights reserved.
# by - Rene Fontcha - Oracle LiveLabs Platform Lead
# Last Updated - 11/01/2022
********************
*/
output "workshop_desc" {
  value = format("Multi Labs Workshops Setup for Product_Name on LiveLabs. Count of total instances provisioned: %s virtual machines of %s shape ",
    var.instance_count,
    local.instance_shape
  )
}

output "instances" {
  value = formatlist("%s - %s",
    oci_core_instance.llw-hol.*.display_name,
    oci_core_instance.llw-hol.*.public_ip
  )
}

output "remote_desktop" {
  value = formatlist("http://%s%s%s%s",
    oci_core_instance.llw-hol.*.public_ip,
    "/livelabs/vnc.html?password=",
    random_string.vncpwd.*.result,
    "&resize=scale&quality=9&autoconnect=true&reconnect=true"
  )
}


