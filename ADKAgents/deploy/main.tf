terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.29.0"
    }
  }
}

variable "project_id" {
  type        = string
  description = "The Google Cloud Project ID"
}

variable "website_domain" {
  type        = string
  description = "The domain to crawl for the vector search data store (e.g. www.example.com)"
}

provider "google" {
  project               = var.project_id
  region                = "us-central1"
  user_project_override = true
  billing_project       = var.project_id
}

# 1. Create the Data Store
resource "google_discovery_engine_data_store" "website_datastore" {
  project                     = var.project_id
  location                    = "global"
  data_store_id               = "website-ds"
  display_name                = "website-ds"
  industry_vertical           = "GENERIC"
  content_config              = "PUBLIC_WEBSITE"
  solution_types              = ["SOLUTION_TYPE_SEARCH"]
  create_advanced_site_search = false
}

# 2. Crawl all pages under the domain
resource "google_discovery_engine_target_site" "all_pages" {
  project              = var.project_id
  location             = google_discovery_engine_data_store.website_datastore.location
  data_store_id        = google_discovery_engine_data_store.website_datastore.data_store_id
  provided_uri_pattern = "${var.website_domain}/*"
  type                 = "INCLUDE"
}

# 3. Create the Search AI Application
resource "google_discovery_engine_search_engine" "website_search_app" {
  project        = var.project_id
  location       = google_discovery_engine_data_store.website_datastore.location
  engine_id      = "website-search-app"
  display_name   = "website-search-app"
  data_store_ids = [google_discovery_engine_data_store.website_datastore.data_store_id]
  collection_id  = "default_collection"

  search_engine_config {
    search_tier    = "SEARCH_TIER_ENTERPRISE"
    search_add_ons = ["SEARCH_ADD_ON_LLM"]
  }
}

# Output the Engine ID — use this as VERTEX_DATA_STORE_ID in your .env
output "vertex_data_store_id" {
  description = "Set this as VERTEX_DATA_STORE_ID in bank_agent/.env"
  value       = google_discovery_engine_search_engine.website_search_app.engine_id
}
