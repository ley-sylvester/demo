/*
********************
# Copyright (c) 2025 Oracle and/or its affiliates. All rights reserved.
# by - Rene Fontcha - Oracle LiveLabs Platform Lead
# Last Updated - 06/28/2022
********************
*/
data "oci_identity_availability_domain" "ad" {
    compartment_id = var.ociTenancyOcid
    ad_number      = 1
  }
resource "oci_core_instance" "llw-hol" {
  count               = var.instance_count
  availability_domain = data.oci_identity_availability_domain.ad.name
  compartment_id      = var.ociCompartmentOcid
  display_name        = "llw-hol-s${format("%02d", count.index + 1)}-${local.timestamp}"
  shape               = local.instance_shape
  metadata = {
    ssh_authorized_keys = var.resUserPublicKey
    vncpwd              = random_string.vncpwd.result
    desktop_guide_url   = var.desktop_guide_url
    desktop_app1_url    = var.desktop_app1_url
    desktop_app2_url    = var.desktop_app2_url
  }
  depends_on = [oci_core_app_catalog_subscription.mp_image_subscription]

  dynamic "shape_config" {
    for_each = local.is_flex_shape
    content {
      ocpus = var.instance_shape_config_ocpus
    }
  }

  create_vnic_details {
    assign_public_ip = true
    display_name     = "llw-hol-s${format("%02d", count.index + 1)}-${local.timestamp}"
    hostname_label   = "llw-hol-s${format("%02d", count.index + 1)}-${local.timestamp}"
    subnet_id        = var.ociPublicSubnetOcid
  }

  source_details {
    source_id   = var.instance_image_id
    source_type = "image"
  }

  lifecycle {
    ignore_changes = [
      display_name, create_vnic_details[0].display_name, create_vnic_details[0].hostname_label,
    ]
  }
}

resource "time_sleep" "wait" {
  depends_on      = [oci_core_instance.llw-hol]
  create_duration = var.novnc_delay_sec
}
