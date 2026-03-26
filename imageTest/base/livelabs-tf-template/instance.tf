/*
********************
# Copyright (c) 2025 Oracle and/or its affiliates. All rights reserved.
# by - Rene Fontcha - Oracle LiveLabs Platform Lead
# Last Updated - 06/28/2022
********************
*/

locals {
  workshop_map = {
    retail     = "https://objectstorage.us-ashburn-1.oraclecloud.com/p/lq-RHb168OE9MebS7yCZRZWYg81728T2Kl-eJxE8txO5lU-8Wg3xipebfWiKlVYI/n/c4u02/b/livestackbucket/o/retailapp.zip"
    agent      = "https://objectstorage.us-ashburn-1.oraclecloud.com/p/twoDNdBr-Akaon32XS8NaKtcSKxlg5Aq-_X9Tg4P_RQVDfY9QvfqTmAl1dqo8dKJ/n/c4u02/b/livestackbucket/o/agentapp_updated.zip"
  }

  normalized_industry = lower(trimspace(var.industry))
  industry_supported  = contains(keys(local.workshop_map), local.normalized_industry)
  resolved_default    = local.industry_supported ? local.workshop_map[local.normalized_industry] : ""
  selected_source     = trimspace(var.custom_workshopfiles)
  selected_workshop = (
    local.selected_source != ""
    ? local.selected_source
    : local.resolved_default
  )
}

data "oci_identity_availability_domain" "ad" {
    compartment_id = local.tenancy_ocid
    ad_number      = 1
  }
resource "oci_core_instance" "llw-hol" {
  count               = var.instance_count
  availability_domain = data.oci_identity_availability_domain.ad.name
  compartment_id      = local.compartment_ocid
  display_name        = "llw-hol-s${format("%02d", count.index + 1)}-${local.timestamp}"
  shape               = local.instance_shape
  metadata = {
    ssh_authorized_keys = local.ssh_authorized_keys
    workshopfiles       = local.selected_workshop
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
    subnet_id        = local.public_subnet_ocid
  }

  source_details {
    source_id   = var.instance_image_id
    source_type = "image"
  }

  lifecycle {
    ignore_changes = [
      display_name, create_vnic_details[0].display_name, create_vnic_details[0].hostname_label,
    ]
    precondition {
      condition     = local.public_subnet_ocid != ""
      error_message = "Provide a public subnet OCID via either ociPublicSubnetOcid or subnet_public_existing."
    }
    precondition {
      condition     = local.selected_workshop != ""
      error_message = "Either choose a supported industry (retail or agent) or provide a custom workshop zip URL."
    }
  }
}

resource "time_sleep" "wait" {
  depends_on      = [oci_core_instance.llw-hol]
  create_duration = var.novnc_delay_sec
}
