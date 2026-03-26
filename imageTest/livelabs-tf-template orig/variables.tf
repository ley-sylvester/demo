/*
********************
# Copyright (c) 2025 Oracle and/or its affiliates. All rights reserved.
# by - Rene Fontcha - Oracle LiveLabs Platform Lead
# Last Updated - 11/01/2022
********************
*/
variable "ociTenancyOcid" { default = ""}
variable "ociUserOcid" {default = ""}
variable "ociCompartmentOcid" {default = ""}
variable "ociUserPassword" {default = ""}
variable "ociRegionIdentifier" { default = ""}
variable "resId" { default = ""}
variable "ociPrivateSubnetOcid" {default = ""}
variable "ociPublicSubnetOcid" {default = ""}
variable "ociVcnOcid" {default = ""}
variable "resUserPublicKey" {default = ""}
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
  default = ""
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
  default = ""
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
}
