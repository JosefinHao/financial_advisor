#!/usr/bin/env python3
"""
Test script for database session management improvements.
This script tests the new context manager and database utilities.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.utils.database import get_db_session, DatabaseManager
from app.models_base import Conversation, Message
from datetime import datetime, timezone

def test_context_manager():
    """Test the get_db_session context manager"""
    print("Testing get_db_session context manager...")
    
    try:
        with get_db_session() as session:
            # Test creating a conversation
            conversation = Conversation(title="Test Conversation")
            session.add(conversation)
            session.flush()  # Get the ID without committing
            
            print(f"✓ Created conversation with ID: {conversation.id}")
            
            # Test querying
            result = session.query(Conversation).filter_by(id=conversation.id).first()
            print(f"✓ Retrieved conversation: {result.title}")
            
            # The session will be committed automatically when exiting the context
            print("✓ Context manager test completed successfully")
            
    except Exception as e:
        print(f"✗ Context manager test failed: {e}")
        return False
    
    return True

def test_database_manager():
    """Test the DatabaseManager class"""
    print("\nTesting DatabaseManager class...")
    
    def create_test_conversation(session, title):
        """Helper function to create a conversation"""
        conversation = Conversation(title=title)
        session.add(conversation)
        session.flush()
        return conversation
    
    def query_conversation(session, conversation_id):
        """Helper function to query a conversation"""
        return session.query(Conversation).filter_by(id=conversation_id).first()
    
    try:
        # Test execute_transaction
        conversation = DatabaseManager.execute_transaction(
            create_test_conversation, 
            "DatabaseManager Test"
        )
        print(f"✓ Created conversation via DatabaseManager: {conversation.title}")
        
        # Test execute_query
        result = DatabaseManager.execute_query(
            query_conversation, 
            conversation.id
        )
        print(f"✓ Retrieved conversation via DatabaseManager: {result.title}")
        
        print("✓ DatabaseManager test completed successfully")
        
    except Exception as e:
        print(f"✗ DatabaseManager test failed: {e}")
        return False
    
    return True

def test_error_handling():
    """Test error handling in database sessions"""
    print("\nTesting error handling...")
    
    try:
        with get_db_session() as session:
            # This should cause an error (invalid column)
            session.execute("SELECT * FROM non_existent_table")
            print("✗ Expected error was not raised")
            return False
            
    except Exception as e:
        print(f"✓ Error properly caught and handled: {type(e).__name__}")
        print("✓ Error handling test completed successfully")
        return True

def cleanup_test_data():
    """Clean up test data"""
    print("\nCleaning up test data...")
    
    try:
        with get_db_session() as session:
            # Delete test conversations
            test_conversations = session.query(Conversation).filter(
                Conversation.title.like("Test%")
            ).all()
            
            for conv in test_conversations:
                session.delete(conv)
            
            print(f"✓ Cleaned up {len(test_conversations)} test conversations")
            
    except Exception as e:
        print(f"✗ Cleanup failed: {e}")
        return False
    
    return True

def main():
    """Run all tests"""
    print("🧪 Testing Database Session Management Improvements")
    print("=" * 50)
    
    tests = [
        ("Context Manager", test_context_manager),
        ("Database Manager", test_database_manager),
        ("Error Handling", test_error_handling),
        ("Cleanup", cleanup_test_data)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Running {test_name} test...")
        if test_func():
            passed += 1
            print(f"✅ {test_name} test PASSED")
        else:
            print(f"❌ {test_name} test FAILED")
    
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! Database session management is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 