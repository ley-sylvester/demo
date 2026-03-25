/*
********************
# Copyright (c) 2025 Oracle and/or its affiliates. All rights reserved.
# by - Rene Fontcha - Oracle LiveLabs Platform Lead
# Last Updated - 10/26/2022
********************
*/

terraform {
  required_version = ">= 1.1.0"
  # required_providers {
  #   # oci = {
  #   #   source  = "oracle/oci"
  #   #   version = ">= 5.0.0"
  #   # }
  #   random = {
  #     source  = "hashicorp/random"
  #     version = ">= 3.3.2"
  #   }
  # }
}


provider "oci" {
  tenancy_ocid = local.tenancy_ocid
  region       = local.provider_region != "" ? local.provider_region : null
}
