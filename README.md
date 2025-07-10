# Financial Advisor Application

An AI-powered financial advisory system with modular architecture, comprehensive error handling, and RESTful API design. Built with Flask backend and React frontend.

## 🚀 Features

- **AI Chat Interface**: Interactive conversations with financial advisor AI powered by OpenAI
- **Financial Calculators**: Retirement, mortgage, and compound interest calculators with detailed projections
- **Document Analysis**: Upload and analyze financial documents (PDF, CSV, Excel, Word)
- **Conversation Management**: Search, tag, and organize chat history
- **Goal Tracking**: Set and monitor financial goals with progress tracking
- **Reminders**: Schedule financial reminders and tasks
- **Dashboard**: Overview of financial metrics and progress
- **Net Worth Tracking**: Monitor assets and liabilities
- **Education Resources**: Financial education content and tools

## 🏗️ Architecture

The application uses a modular structure with clear separation of concerns:

```
financial_advisor/
├── app/
│   ├── __init__.py
│   ├── main.py              # Application factory and main entry point
│   ├── models.py            # Database models
│   ├── db.py               # Database configuration
│   ├── routes/              # API route modules
│   │   ├── __init__.py
│   │   ├── conversations.py # Conversation management endpoints
│   │   ├── calculators.py   # Financial calculator endpoints
│   │   ├── documents.py     # Document upload/analysis endpoints
│   │   ├── education.py     # Education content endpoints
│   │   └── dashboard.py     # Dashboard analytics endpoints
│   ├── services/            # Business logic services
│   │   ├── chat.py          # AI chat service
│   │   └── taxes.py         # Tax calculation service
│   └── utils/               # Utility modules
│       ├── __init__.py
│       ├── error_handlers.py # Centralized error handling
│       ├── document_processor.py # Document processing utilities
│       └── database.py      # Database session management
├── client/                  # React frontend
│   ├── src/
│   │   ├── pages/          # React page components
│   │   ├── ui/             # Reusable UI components
│   │   └── utils/          # Frontend utilities
├── alembic/                 # Database migrations
├── tests/                   # Comprehensive test suite
├── uploads/                 # Document upload storage
├── config.py               # Configuration management
├── requirements.txt        # Python dependencies
├── runtime.txt            # Python version specification
└── env.example            # Environment variables template
```

## 🔌 API Design

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
- `DELETE /documents/delete-all` - Delete all documents
- `POST /documents/<filename>/analyze` - Re-analyze document

#### Dashboard
- `GET /dashboard` - Get dashboard analytics and statistics

#### Education
- `GET /education` - Get financial education content

## 🛠️ Setup Instructions

### Prerequisites

- **Python 3.12+** (required for SQLAlchemy compatibility)
- **PostgreSQL database**
- **OpenAI API key**
- **Node.js 16+** (for frontend)

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
   - Run database migrations:
     ```bash
     alembic upgrade head
     ```

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

## 🔧 Environment Variables

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

## 🚀 Deployment

### Render Deployment

1. **Create a Render account** and connect your repository
2. **Add a PostgreSQL database** in Render dashboard
3. **Create a Web Service** with these settings:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn -b 0.0.0.0:8000 app.main:app`
   - **Environment Variables**: Set `DATABASE_URL` to your PostgreSQL connection string
4. **Deploy** your service

### PythonAnywhere Deployment

1. **Upload your code** to PythonAnywhere
2. **Create a virtual environment** with Python 3.12
3. **Install dependencies**: `pip install -r requirements.txt`
4. **Set up environment variables** in the web app configuration
5. **Configure WSGI file** to point to `app.main:app`
6. **Reload** your web app

### Local Production Setup

1. **Set production environment variables**
   ```bash
   export FLASK_DEBUG=False
   export SECRET_KEY=your-secure-production-key
   ```

2. **Run with Gunicorn**
   ```bash
   gunicorn -b 0.0.0.0:8000 app.main:app
   ```

## 🧪 Testing

### Running Tests
```bash
# Run all tests
python -m pytest tests/

# Run specific test categories
python -m pytest tests/test_api_endpoints.py
python -m pytest tests/test_utils.py
python -m pytest tests/test_integration.py
```

### Test Coverage
The application includes comprehensive test coverage:
- **Unit Tests**: Individual function and component testing
- **Integration Tests**: End-to-end workflow testing
- **API Tests**: All endpoint functionality testing
- **Error Handling Tests**: Comprehensive error scenario testing

## 🔒 Error Handling

The application implements comprehensive error handling:

- **Centralized Error Handler**: All API errors are handled consistently
- **Proper HTTP Status Codes**: Appropriate status codes for different error types
- **Error Logging**: Detailed error logging with context
- **User-Friendly Messages**: Clear error messages for users
- **Input Validation**: Comprehensive validation for all inputs
- **Error Tracking**: Unique error IDs for debugging

## 📊 Health Checks

- `/health` - Detailed health check with service status
- `/ping` - Simple health check
- `/api` - API documentation

## 🔧 Development

### Code Style
The project follows PEP 8 style guidelines.

### Adding New Features
1. Create new route module in `app/routes/`
2. Add business logic in `app/services/`
3. Update API documentation in `app/main.py`
4. Add tests for new functionality
5. Update error handling as needed

### Database Migrations
```bash
# Create new migration
alembic revision --autogenerate -m "Description of changes"

# Apply migrations
alembic upgrade head
```

## 🔒 Security Considerations

- **Input Validation**: All endpoints validated
- **File Upload Security**: Type and size validation
- **SQL Injection Prevention**: SQLAlchemy ORM usage
- **CORS Configuration**: Proper cross-origin settings
- **Environment Variable Management**: Secure configuration handling
- **Secure Filename Handling**: Safe file operations

## 📈 Performance

- **Database Optimization**: Connection pooling and session management
- **Caching**: Strategic caching for frequently accessed data
- **Error Handling**: Efficient error processing
- **File Processing**: Optimized document analysis
- **API Response**: Fast response times with proper status codes

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes with proper error handling
4. Add tests for new functionality
5. Commit changes (`git commit -m 'Add amazing feature'`)
6. Push to branch (`git push origin feature/amazing-feature`)
7. Submit pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation in `/docs`
- Review error logs for debugging
- Open an issue on GitHub
- Contact the development team

---

**Status**: ✅ Production Ready  
**Last Updated**: July 2024  
**Version**: 1.0.0 