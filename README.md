# Financial Advisor Application

An AI-powered financial advisory system with modular architecture, comprehensive error handling, and RESTful API design.

## Features

- **AI Chat Interface**: Interactive conversations with financial advisor AI
- **Financial Calculators**: Retirement, mortgage, and compound interest calculators
- **Document Analysis**: Upload and analyze financial documents (PDF, CSV, Excel)
- **Conversation Management**: Search, tag, and organize chat history
- **Goal Tracking**: Set and monitor financial goals
- **Reminders**: Schedule financial reminders and tasks
- **Dashboard**: Overview of financial metrics and progress

## Architecture

The application has been refactored into a modular structure:

```
financial_advisor/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application factory and main entry point
│   ├── models.py            # Database models
│   ├── routes/              # API route modules
│   │   ├── __init__.py
│   │   ├── conversations.py # Conversation management endpoints
│   │   ├── calculators.py   # Financial calculator endpoints
│   │   └── documents.py     # Document upload/analysis endpoints
│   ├── services/            # Business logic services
│   │   ├── chat.py          # AI chat service
│   │   └── taxes.py         # Tax calculation service
│   └── utils/               # Utility modules
│       ├── __init__.py
│       ├── error_handlers.py # Centralized error handling
│       └── document_processor.py # Document processing utilities
├── client/                  # React frontend
├── config.py               # Configuration management
├── requirements.txt        # Python dependencies
└── env.example            # Environment variables template
```

## API Design

The API follows RESTful conventions with proper versioning:

### Base URL: `/api/v1`

#### Conversations
- `POST /conversations` - Create new conversation
- `GET /conversations` - List all conversations
- `GET /conversations/<id>` - Get specific conversation
- `POST /conversations/<id>` - Send message to conversation
- `POST /conversations/<id>/rename` - Rename conversation
- `POST /conversations/<id>/auto_rename` - Auto-rename conversation
- `PATCH /conversations/<id>/tags` - Update conversation tags
- `DELETE /conversations/<id>` - Delete conversation

#### Calculators
- `POST /calculators/retirement` - Retirement savings calculator
- `POST /calculators/mortgage` - Mortgage payment calculator
- `POST /calculators/compound-interest` - Compound interest calculator

#### Documents
- `POST /documents/upload` - Upload and analyze document
- `GET /documents/history` - Get document history
- `DELETE /documents/<filename>` - Delete document
- `POST /documents/<filename>/analyze` - Re-analyze document

## Setup Instructions

### Prerequisites

- Python 3.8+
- PostgreSQL database
- OpenAI API key
- Node.js (for frontend)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd financial_advisor
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your actual values
   ```

5. **Configure database**
   - Create PostgreSQL database
   - Update database credentials in `.env`

6. **Run the application**
   ```bash
   python -m app.main
   ```

### Frontend Setup

1. **Navigate to client directory**
   ```bash
   cd client
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm start
   ```

## Environment Variables

Create a `.env` file with the following variables:

```env
# Flask Configuration
FLASK_DEBUG=True
FLASK_HOST=127.0.0.1
FLASK_PORT=5000
SECRET_KEY=your-secret-key-here

# Database Configuration
DB_USER=postgres
DB_PASSWORD=your-database-password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_advisor

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=1000
OPENAI_TEMPERATURE=0.3

# File Upload Configuration
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# Logging Configuration
LOG_LEVEL=INFO
```

## Error Handling

The application implements comprehensive error handling:

- **Centralized Error Handler**: All API errors are handled consistently
- **Proper HTTP Status Codes**: Appropriate status codes for different error types
- **Error Logging**: Detailed error logging with context
- **User-Friendly Messages**: Clear error messages for users
- **Input Validation**: Comprehensive validation for all inputs

## API Documentation

Access the API documentation at `/api` endpoint when the server is running.

## Health Checks

- `/health` - Detailed health check with service status
- `/ping` - Simple health check

## Development

### Running Tests
```bash
python -m pytest tests/
```

### Code Style
The project follows PEP 8 style guidelines.

### Adding New Features
1. Create new route module in `app/routes/`
2. Add business logic in `app/services/`
3. Update API documentation in `app/main.py`
4. Add tests for new functionality

## Production Deployment

1. Set `FLASK_DEBUG=False`
2. Configure production database
3. Set secure `SECRET_KEY`
4. Configure proper CORS origins
5. Set up reverse proxy (nginx)
6. Use WSGI server (gunicorn)

## Security Considerations

- Input validation on all endpoints
- File upload security (type and size validation)
- SQL injection prevention (SQLAlchemy ORM)
- CORS configuration
- Environment variable management
- Secure filename handling

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with proper error handling
4. Add tests
5. Submit pull request

## License

[Add your license here] 