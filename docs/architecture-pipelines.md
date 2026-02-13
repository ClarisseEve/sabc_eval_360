# Architecture — Data Pipelines (Python)

## Overview

Python ETL layer to ingest, transform, and load evaluation data and reference datasets into analytics stores. The pipeline connects to MySQL/PostgreSQL/ClickHouse using SQLAlchemy and native drivers.

## Components

- **Entry point**: `data_pipelines/main_pipeline.py`
- **Extract**: `data_pipelines/extract/`
- **Transform**: `data_pipelines/transform/`
- **Load**: `data_pipelines/load/`
- **Models/Utils**: `data_pipelines/models/`, `data_pipelines/utils/`
- **Config**: `data_pipelines/config/`

## Storage Targets

- PostgreSQL and MySQL as sources
- ClickHouse as analytics target

## Notes

- Requires Python 3.x with packages from `data_pipelines/requirements.txt`.
- Dockerfile provided for pipeline runtime.

