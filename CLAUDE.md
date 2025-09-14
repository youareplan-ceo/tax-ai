# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

YouArePlan EasyTax v8 is a Korean tax AI copilot application consisting of:
- **Backend**: FastAPI application (`api/`) with AI-powered transaction classification
- **Frontend**: Vanilla JavaScript PWA (`ui/`) with multiple integrated workflows
- **Database**: SQLite with SQLAlchemy ORM
- **AI Integration**: OpenAI GPT models for transaction classification and analysis

## Development Commands

### Backend Development
```bash
# Setup virtual environment
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# venv\Scripts\activate   # On Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn api.main:app --reload --port 8080
```

### Frontend Development
```bash
# Serve UI files (development)
python -m http.server 5173 -d ui
```

### Testing
```bash
# Run end-to-end tests
python e2e_test.py

# Run smoke tests
python smoke_test.py

# Run LLM quality tests
python llm_qos_test.py
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Build standalone image
docker build -t tax-ai .
```

## Architecture

### Backend Structure (`api/`)
- `main.py`: FastAPI app entry point with middleware, routing, and static file serving
- `routers/`: API endpoints grouped by functionality
  - `ai.py`: AI-powered transaction classification
  - `entries.py`: Transaction CRUD operations
  - `ingest.py`: File upload and data ingestion
  - `tax.py`: Tax calculations and estimates
  - `prep.py`: Tax preparation workflows
  - `debug.py`: Development and debugging utilities
- `db/`: Database layer
  - `models.py`: SQLAlchemy models for transactions and metadata
  - `database.py`: Database connection and configuration
  - `utils.py`: Database initialization utilities
- `clients/openai_client.py`: OpenAI API integration with demo mode fallback
- `services/`: Business logic layer
  - `classification.py`: Transaction classification algorithms
  - `prep.py`: Tax preparation service logic
- `utils/`: Shared utilities (logging, cost estimation, validation)

### Frontend Structure (`ui/`)
- `index.html`: Main application shell
- `app.js`: Core application logic and routing
- `api-integration.js`: Backend API communication
- Workflow modules:
  - `workflow-integration.js`: Tab-based workflow system
  - `smart-checklist.js`: Interactive tax checklist
  - `receipt-ocr.js`: Receipt processing and OCR
  - `tax-dashboard.js`: Tax analysis dashboard
- `styles.css` / `workflow-styles.css`: Application styling
- `sw.js`: Service worker for PWA functionality

### Key Features
- **AI Classification**: Automatic categorization of transactions using OpenAI models
- **Demo Mode**: Fallback simulation when using demo API keys
- **Multi-workflow UI**: Integrated tax preparation workflows with persistent state
- **Receipt Processing**: OCR and automated data extraction
- **Real-time Validation**: Live tax compliance checking

## Configuration

### Environment Variables (.env)
Required variables:
- `OPENAI_API_KEY`: OpenAI API key (use `sk-proj-demo-*` for demo mode)
- `DATABASE_URL`: SQLite database path (default: `sqlite:///./youareplan_tax_ai.db`)

OpenAI Model Configuration:
- `OPENAI_MODEL_CLASSIFY`: Model for transaction classification (default: `gpt-4o-mini`)
- `OPENAI_MODEL_ANALYSIS`: Model for detailed analysis (default: `gpt-4o`)

### Tax Rules Configuration
- `rules/vat_rules_v0_2.json`: Korean VAT classification rules and keyword mappings
- Defines non-deductible categories, account mapping, and vendor-specific defaults

## Database Schema

Key models in `api/db/models.py`:
- Transaction records with vendor, amount, classification, and AI confidence scores
- Metadata tracking for processing statistics and audit trails

## AI Integration Notes

The application uses OpenAI models with intelligent fallbacks:
1. **Demo Mode**: Simulated responses for development (when API key starts with `sk-proj-demo`)
2. **Production Mode**: Real OpenAI API calls with retry logic
3. **Fallback**: Basic classification rules when AI is unavailable

Transaction classification considers:
- Korean tax terminology and account codes
- VAT deductibility rules
- Vendor-specific patterns from `rules/vat_rules_v0_2.json`

## Development Notes

- The application is designed for Korean tax compliance
- UI text and business logic are primarily in Korean
- Database operations use SQLAlchemy ORM with automatic table creation
- The frontend is a PWA with offline capabilities via service worker
- API responses include cost estimation for OpenAI usage tracking