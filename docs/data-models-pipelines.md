# Data Models — Data Pipelines

## Overview

The pipeline layer connects to external databases (PostgreSQL, MySQL, ClickHouse) via SQLAlchemy and drivers. No local schema files were detected in `data_pipelines/`.

## Sources

- `requirements.txt` indicates connectors for Postgres/MySQL/ClickHouse.
- Schema is expected to be managed by the core app and analytics SQL scripts.

