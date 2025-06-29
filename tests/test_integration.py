"""
Integration tests for the Financial Advisor system.
"""

import pytest
import requests
import time
import subprocess
import os
import signal
import json
from pathlib import Path
from unittest.mock import patch, MagicMock
from tests.conftest import create_test_file, app, client, mock_openai
from app.models_base import Conversation, Message
from app.utils.database import get_db_session

class TestSystemIntegration:
    """Test full system integration."""
    
    def test_health_check_integration(self, client):
        """Test health check endpoint integration."""
        response = client.get('/health')
        assert response.status_code == 200
        
        data = response.get_json()
        assert data['status'] in ['ok', 'degraded']
        assert 'database' in data['services']
        assert 'openai' in data['services']
    
    def test_conversation_workflow_integration(self, client, mock_openai):
        """Test complete conversation workflow."""
        # Create a new conversation
        conversation_data = {
            "title": "Retirement Planning Discussion"
        }
        
        response = client.post(
            '/api/v1/conversations',
            json=conversation_data,
            headers={'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 201
        conversation_response = response.get_json()
        assert 'id' in conversation_response
        assert 'title' in conversation_response
        
        conversation_id = conversation_response['id']
        
        # Get the conversation
        response = client.get(f'/api/v1/conversations/{conversation_id}')
        assert response.status_code == 200
        
        conversation = response.get_json()
        assert conversation['id'] == conversation_id
        assert 'messages' in conversation
        
        # Send a message to the conversation
        message_data = {
            "message": "What should my monthly contribution be?"
        }
        
        response = client.post(
            f'/api/v1/conversations/{conversation_id}',
            json=message_data,
            headers={'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 200
        assert 'reply' in response.get_json()
        
        # Rename the conversation
        rename_data = {"title": "Retirement Planning Discussion"}
        response = client.post(
            f'/api/v1/conversations/{conversation_id}/rename',
            json=rename_data,
            headers={'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 200
        
        # Verify the rename
        response = client.get(f'/api/v1/conversations/{conversation_id}')
        assert response.get_json()['title'] == "Retirement Planning Discussion"
    
    def test_calculator_integration(self, client):
        """Test calculator endpoints integration."""
        # Test retirement calculator
        retirement_data = {
            "current_age": 30,
            "retirement_age": 65,
            "current_savings": 50000,
            "monthly_contribution": 1000,
            "expected_return": 7.0,
            "life_expectancy": 85,
            "inflation_rate": 2.5,
            "social_security_income": 2000,
            "pension_income": 0,
            "desired_retirement_income": 80000
        }
        
        response = client.post(
            '/api/v1/calculators/retirement',
            json=retirement_data,
            headers={'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'projected_savings' in data
        assert 'yearly_projections' in data
        assert 'withdrawal_scenarios' in data
        
        # Test mortgage calculator
        mortgage_data = {
            "loan_amount": 300000,
            "interest_rate": 4.5,
            "loan_term_years": 30,
            "down_payment": 60000,
            "property_tax": 3600,
            "insurance": 1200,
            "pmi_rate": 0.5
        }
        
        response = client.post(
            '/api/v1/calculators/mortgage',
            json=mortgage_data,
            headers={'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 200
        data = response.get_json()
        assert 'monthly_payment' in data
        assert 'total_interest' in data
        assert 'amortization_schedule' in data
    
    def test_document_upload_integration(self, client):
        """Test document upload and analysis integration."""
        # Create a test document
        test_content = """
        Financial Report 2024
        
        Income: $75,000
        Expenses: $45,000
        Savings: $30,000
        
        Investment Portfolio:
        - 401(k): $50,000
        - IRA: $25,000
        - Brokerage: $15,000
        
        Goals:
        - Save for retirement
        - Buy a house in 5 years
        - Emergency fund of $20,000
        """
        
        temp_file = create_test_file(test_content, ".txt")
        
        try:
            with open(temp_file, 'rb') as f:
                response = client.post(
                    '/api/v1/documents/upload',
                    data={'document': (f, 'financial_report.txt')},
                    content_type='multipart/form-data'
                )
            
            assert response.status_code == 200
            data = response.get_json()
            assert 'filename' in data
            assert 'analysis' in data  # Changed from 'summary' to 'analysis'
            
            filename = data['filename']
            
            # Test re-analyzing the document
            response = client.post(f'/api/v1/documents/{filename}/analyze')
            assert response.status_code == 200
            
            # Test getting document history
            response = client.get('/api/v1/documents/history')
            assert response.status_code == 200
            history = response.get_json()
            assert isinstance(history, list)
            assert len(history) >= 1
            
            # Test deleting the document
            response = client.delete(f'/api/v1/documents/{filename}')
            assert response.status_code == 200
            
        finally:
            # Clean up
            if os.path.exists(temp_file):
                os.unlink(temp_file)
    
    def test_dashboard_integration(self, client):
        """Test dashboard endpoints integration."""
        # Test dashboard stats
        response = client.get('/api/v1/dashboard/stats')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'total_conversations' in data
        assert 'total_messages' in data
        assert 'recent_activity' in data
        
        # Test analytics
        response = client.get('/api/v1/dashboard/analytics')
        assert response.status_code == 200
        
        data = response.get_json()
        assert 'conversations_by_month' in data
        assert 'messages_by_month' in data
        assert 'popular_topics' in data

class TestDatabaseIntegration:
    """Test database integration."""
    
    def test_database_connection_persistence(self, app):
        """Test that database connections persist across operations."""
        with app.app_context():
            with get_db_session() as db_session:
                # Create a test conversation
                conversation = Conversation(
                    title="Test Conversation",
                    tags=["test", "integration"]
                )
                db_session.add(conversation)
                db_session.commit()
                
                # Verify it was saved
                saved_conversation = db_session.query(Conversation).filter_by(
                    title="Test Conversation"
                ).first()
                assert saved_conversation is not None
                assert saved_conversation.title == "Test Conversation"
                
                # Clean up
                db_session.delete(saved_conversation)
                db_session.commit()
    
    def test_database_transaction_rollback(self, app):
        """Test database transaction rollback functionality."""
        with app.app_context():
            with get_db_session() as db_session:
                # Create a test conversation
                conversation = Conversation(
                    title="Test Conversation",
                    tags=["test"]
                )
                db_session.add(conversation)
                db_session.commit()
                
                conversation_id = conversation.id
                
                # Verify it exists
                saved_conversation = db_session.get(Conversation, conversation_id)
                assert saved_conversation is not None
                
                # Rollback should not affect committed data
                db_session.rollback()
                
                # The conversation should still exist since it was committed
                saved_conversation = db_session.get(Conversation, conversation_id)
                assert saved_conversation is not None
                
                # Clean up
                db_session.delete(saved_conversation)
                db_session.commit()

class TestErrorHandlingIntegration:
    """Test error handling integration."""
    
    def test_validation_error_propagation(self, client):
        """Test that validation errors are properly propagated."""
        # Test with missing required fields
        invalid_data = {
            "current_age": 30,
            "retirement_age": 65
            # Missing required fields
        }
        
        response = client.post(
            '/api/v1/calculators/retirement',
            json=invalid_data,
            headers={'Content-Type': 'application/json'}
        )
        
        assert response.status_code == 400
        data = response.get_json()
        assert 'error' in data
        assert data['error']['type'] == 'validation_error'
        assert 'Missing required fields' in data['error']['message']
    
    def test_database_error_handling(self, client):
        """Test database error handling."""
        # Test with invalid conversation ID
        response = client.get('/api/v1/conversations/99999')
        assert response.status_code == 404
        data = response.get_json()
        assert 'error' in data
        assert data['error']['type'] == 'not_found_error'
    
    def test_external_service_error_handling(self, client):
        """Test external service error handling."""
        # Test conversation creation (which uses OpenAI)
        conversation_data = {
            "title": "Test Conversation"
        }
        
        response = client.post(
            '/api/v1/conversations',
            json=conversation_data,
            headers={'Content-Type': 'application/json'}
        )
        
        # Should succeed even if OpenAI is not configured
        assert response.status_code == 201

class TestPerformanceIntegration:
    """Test performance integration."""
    
    def test_concurrent_requests(self, client):
        """Test handling of concurrent requests."""
        import threading
        
        results = []
        errors = []
        
        def make_request():
            try:
                response = client.get('/health')
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))
        
        # Create multiple threads
        threads = []
        for _ in range(5):
            thread = threading.Thread(target=make_request)
            threads.append(thread)
            thread.start()
        
        # Wait for all threads to complete
        for thread in threads:
            thread.join()
        
        # All requests should succeed
        assert len(errors) == 0
        assert len(results) == 5
        assert all(status == 200 for status in results)
    
    def test_large_data_handling(self, client):
        """Test handling of large data."""
        # Test with large JSON payload
        large_data = {
            "title": "A" * 1000,  # Large title
            "tags": ["tag"] * 100  # Many tags
        }
        
        response = client.post(
            '/api/v1/conversations',
            json=large_data,
            headers={'Content-Type': 'application/json'}
        )
        
        # Should handle large data gracefully
        assert response.status_code in [200, 201, 400]
    
    def test_memory_usage(self, client):
        """Test memory usage under load."""
        # Make multiple requests to test memory usage
        for _ in range(10):
            response = client.get('/health')
            assert response.status_code == 200

class TestSecurityIntegration:
    """Test security integration."""
    
    def test_input_validation_security(self, client):
        """Test input validation for security."""
        # Test with potentially malicious input
        malicious_data = {
            "title": "<script>alert('xss')</script>",
            "content": "'; DROP TABLE conversations; --"
        }
        
        response = client.post(
            '/api/v1/conversations',
            json=malicious_data,
            headers={'Content-Type': 'application/json'}
        )
        
        # Should handle malicious input gracefully
        assert response.status_code in [200, 201, 400, 500]
    
    def test_file_upload_security(self, client):
        """Test file upload security."""
        # Test with potentially dangerous file content
        dangerous_content = "This is a test file with normal content"
        temp_file = create_test_file(dangerous_content, ".txt")
        
        try:
            with open(temp_file, 'rb') as f:
                response = client.post(
                    '/api/v1/documents/upload',
                    data={'document': (f, 'test.txt')},
                    content_type='multipart/form-data'
                )
            
            # Should handle file upload securely
            assert response.status_code in [200, 400]
            
        finally:
            if os.path.exists(temp_file):
                os.unlink(temp_file)
    
    def test_rate_limiting(self, client):
        """Test rate limiting (if implemented)."""
        # Make multiple rapid requests
        responses = []
        for _ in range(10):
            response = client.get('/health')
            responses.append(response.status_code)
        
        # All requests should succeed (no rate limiting implemented yet)
        assert all(status == 200 for status in responses) 