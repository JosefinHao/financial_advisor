from contextlib import contextmanager
from sqlalchemy.orm import Session
from app.db import SessionLocal
import logging

logger = logging.getLogger(__name__)

@contextmanager
def get_db_session():
    """
    Context manager for database sessions.
    
    Provides automatic session management with:
    - Automatic commit on successful completion
    - Automatic rollback on exceptions
    - Proper session cleanup
    
    Usage:
        with get_db_session() as session:
            # Perform database operations
            result = session.query(Model).all()
            # Session will be committed automatically if no exceptions occur
    """
    session = SessionLocal()
    try:
        yield session
        session.commit()
        logger.debug("Database session committed successfully")
    except Exception as e:
        session.rollback()
        logger.error(f"Database session rolled back due to error: {str(e)}")
        raise
    finally:
        session.close()
        logger.debug("Database session closed")

def get_db_session_dependency():
    """
    Dependency function for use with Flask-DI or similar frameworks.
    
    Returns a database session that should be closed by the caller.
    Use this when you need more control over the session lifecycle.
    
    Returns:
        Session: SQLAlchemy session object
    """
    return SessionLocal()

def execute_in_transaction(func):
    """
    Decorator to execute a function within a database transaction.
    
    Args:
        func: Function to execute within transaction
        
    Returns:
        Decorated function that handles database session management
    """
    def wrapper(*args, **kwargs):
        with get_db_session() as session:
            return func(session, *args, **kwargs)
    return wrapper

class DatabaseManager:
    """
    Database manager class for more complex database operations.
    """
    
    @staticmethod
    def execute_query(query_func, *args, **kwargs):
        """
        Execute a query function within a database session.
        
        Args:
            query_func: Function that takes a session and returns a result
            *args: Arguments to pass to query_func
            **kwargs: Keyword arguments to pass to query_func
            
        Returns:
            Result from query_func
        """
        with get_db_session() as session:
            return query_func(session, *args, **kwargs)
    
    @staticmethod
    def execute_transaction(transaction_func, *args, **kwargs):
        """
        Execute a transaction function within a database session.
        
        Args:
            transaction_func: Function that takes a session and performs operations
            *args: Arguments to pass to transaction_func
            **kwargs: Keyword arguments to pass to transaction_func
            
        Returns:
            Result from transaction_func
        """
        with get_db_session() as session:
            return transaction_func(session, *args, **kwargs) 