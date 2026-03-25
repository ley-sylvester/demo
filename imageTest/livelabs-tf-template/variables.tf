/*
********************
# Copyright (c) 2025 Oracle and/or its affiliates. All rights reserved.
# by - Rene Fontcha - Oracle LiveLabs Platform Lead
# Last Updated - 11/01/2022
********************
*/
variable "ociTenancyOcid" { default = ""}
variable "tenancy_ocid" { default = "" }
variable "ociUserOcid" {default = ""}
variable "ociCompartmentOcid" {default = ""}
variable "compartment_ocid" { default = "" }
variable "ociUserPassword" {default = ""}
variable "ociRegionIdentifier" { default = ""}
variable "region" { default = "" }
variable "resId" { default = ""}
variable "ociPrivateSubnetOcid" {default = ""}
variable "ociPublicSubnetOcid" {default = ""}
variable "ociVcnOcid" {default = ""}
variable "vcn_existing" { default = "" }
variable "resUserPublicKey" {default = ""}
variable "ssh_public_key" { default = "" }
variable "subnet_public_existing" { default = "" }
/*
********************
Marketplace UI Parameters (Update all default values)
********************
*/

variable "use_marketplace_image" {
  # Set to false when testing a local image
  default = true
}

variable "mp_listing_id" {
  #Provide the Listing OCID
  default = ""
}

variable "mp_listing_resource_version" {
  #Provide the listing version
  default = 2.3
}

variable "instance_image_id" {
  #Provide the image OCID
  default = "ocid1.image.oc1.iad.aaaaaaaa7ocu3cnhlinayh56kw57ytq5kmproazsanskth2vd2u7bfai73ia"
}

/*
******************************
Desktop URLs Injection (Update all default values)
******************************
*/
variable "novnc_delay_sec" {
  default = "300s"
}

variable "desktop_guide_url" {
  default = "https://oracle-livelabs.github.io/livestack/big-star-retail-ai-agent/guide/workshops/desktop/"
}

variable "desktop_app1_url" {
  default = ""
}

variable "desktop_app2_url" {
  default = ""
}

/*
******************************
Basic Configuration Details (Readonly - Do not change)
******************************
*/

variable "shape_use_flex" {
  default = true
}

variable "flex_instance_shape" {
  default = "VM.Standard.E5.Flex"
}

variable "fixed_instance_shape" {
  default = "VM.Standard.E2.2"
}

variable "instance_count" {
  default = 1
}

variable "instance_shape_config_ocpus" {
  default = 4
}

variable "industry" {
  description = "Industry to deploy"
  type        = string
  default     = ""
}

variable "custom_workshopfiles" {
  description = "Optional custom workshop zip URL"
  type        = string
  default     = ""
}

resource "random_string" "vncpwd" {
  length  = 10
  upper   = true
  lower   = true
  numeric = true
  special = false
}
#*************************************
#        Local Variables
#*************************************
locals {
  timestamp           = formatdate("YYYY-MM-DD-hhmmss", timestamp())
  instance_shape      = var.shape_use_flex ? var.flex_instance_shape : var.fixed_instance_shape
  is_flex_shape       = var.shape_use_flex ? [var.instance_shape_config_ocpus] : []
  tenancy_candidates     = [for v in [var.tenancy_ocid, var.ociTenancyOcid] : trimspace(v == null ? "" : v) if trimspace(v == null ? "" : v) != ""]
  compartment_candidates = [for v in [var.compartment_ocid, var.ociCompartmentOcid] : trimspace(v == null ? "" : v) if trimspace(v == null ? "" : v) != ""]
  region_candidates      = [for v in [var.region, var.ociRegionIdentifier] : trimspace(v == null ? "" : v) if trimspace(v == null ? "" : v) != ""]
  ssh_key_candidates     = [for v in [var.ssh_public_key, var.resUserPublicKey] : trimspace(v == null ? "" : v) if trimspace(v == null ? "" : v) != ""]
  public_subnet_candidates = [for v in [var.ociPublicSubnetOcid, var.subnet_public_existing] : trimspace(v == null ? "" : v) if trimspace(v == null ? "" : v) != ""]
  tenancy_ocid           = try(local.tenancy_candidates[0], "")
  compartment_ocid       = try(local.compartment_candidates[0], "")
  provider_region        = try(local.region_candidates[0], "us-ashburn-1")
  ssh_authorized_keys    = try(local.ssh_key_candidates[0], "")
  public_subnet_ocid     = try(local.public_subnet_candidates[0], "")
}
