locals {
  workshop_map = {
    retail     = "https://objectstorage.us-ashburn-1.oraclecloud.com/p/lq-RHb168OE9MebS7yCZRZWYg81728T2Kl-eJxE8txO5lU-8Wg3xipebfWiKlVYI/n/c4u02/b/livestackbucket/o/retailapp.zip"
    agent    = "https://objectstorage.us-ashburn-1.oraclecloud.com/p/dYkMDom1qydiWbNNpYEsjpN5YGDt_aRcfLRefFZHkpMj6c1eD013EYoAz9o-8Dub/n/c4u02/b/livestackbucket/o/agentapp.zip"
  }

  normalized_industry = lower(var.industry)

  valid_industry = contains(keys(local.workshop_map), local.normalized_industry)

  selected_workshop = (
    var.custom_workshopfiles != ""
    ? var.custom_workshopfiles
    : (
        local.valid_industry
        ? local.workshop_map[local.normalized_industry]
        : ""
      )
  )
}

resource "null_resource" "validate_input" {
  count = (
    var.custom_workshopfiles == "" && !local.valid_industry
  ) ? 1 : 0

  provisioner "local-exec" {
    command = "echo 'ERROR: Provide a valid industry or custom_workshopfiles' && exit 1"
  }
}

resource "oci_core_instance" "livelabs" {
  availability_domain = var.availability_domain
  compartment_id      = var.compartment_id
  shape               = var.shape
  # Explicit source_details avoids deprecated top-level image usage
  source_details {
    source_type             = "image"
    source_id               = var.custom_image_ocid
    boot_volume_vpus_per_gb = "10"
  }

  shape_config {
    ocpus         = 4
    memory_in_gbs = 64
  }

  create_vnic_details {
    subnet_id        = var.subnet_id
    assign_public_ip = true
  }

  metadata = {
    ssh_authorized_keys = var.ssh_public_key
    workshopfiles       = local.selected_workshop
  }

}
