from flask import Blueprint, request, jsonify
import os
import logging
from werkzeug.utils import secure_filename
from app.utils.error_handlers import (
    handle_api_error, 
    create_error_response,
    ValidationError, 
    NotFoundError, 
    FileError
)
from app.utils.document_processor import extract_text_from_pdf, extract_text_from_txt, extract_data_from_csv, analyze_document_with_ai, count_tokens, chunk_text

# Create blueprint for document routes
documents_bp = Blueprint('documents', __name__)

# Configuration
UPLOAD_FOLDER = "uploads"
ALLOWED_EXTENSIONS = {"pdf", "txt", "csv", "xls", "xlsx"}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    """Check if file extension is allowed"""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@documents_bp.route('/documents/upload', methods=['POST'])
def upload_document():
    """Upload and analyze a financial document"""
    try:
        # Check if file is present
        if 'document' not in request.files:
            validation_error = ValidationError(
                "No file provided",
                field="document"
            )
            return create_error_response(validation_error)
        
        file = request.files['document']
        
        # Check if file was selected
        if file.filename == '':
            validation_error = ValidationError(
                "No file selected",
                field="document"
            )
            return create_error_response(validation_error)
        
        # Validate file type
        if not allowed_file(file.filename):
            validation_error = ValidationError(
                "File type not allowed. Please upload PDF, TXT, CSV, or Excel files.",
                field="document",
                details={"allowed_extensions": list(ALLOWED_EXTENSIONS)}
            )
            return create_error_response(validation_error)
        
        # Check file size
        if request.content_length and request.content_length > MAX_CONTENT_LENGTH:
            validation_error = ValidationError(
                "File too large. Maximum size is 16MB.",
                field="document",
                details={"max_size": MAX_CONTENT_LENGTH}
            )
            return create_error_response(validation_error)
        
        # Secure filename and save file
        if file.filename is None:
            validation_error = ValidationError(
                "Invalid file name.",
                field="document"
            )
            return create_error_response(validation_error)
        
        filename = secure_filename(file.filename)
        file_path = os.path.join(UPLOAD_FOLDER, filename)

        # Ensure unique filename
        counter = 1
        original_filename = filename
        while os.path.exists(file_path):
            name, ext = os.path.splitext(original_filename)
            filename = f"{name}_{counter}{ext}"
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            counter += 1
        
        file.save(file_path)
        
        try:
            # Extract text based on file type
            file_extension = filename.rsplit(".", 1)[1].lower()
            
            if file_extension == "pdf":
                text_content = extract_text_from_pdf(file_path)
            elif file_extension == "txt":
                text_content = extract_text_from_txt(file_path)
            elif file_extension in ["csv", "xls", "xlsx"]:
                text_content = extract_data_from_csv(file_path)
            else:
                validation_error = ValidationError(
                    "Unsupported file type",
                    field="document"
                )
                return create_error_response(validation_error)
            
            if not text_content or text_content.strip() == "":
                file_error = FileError(
                    "Could not extract text from document",
                    operation="text_extraction",
                    file_path=file_path
                )
                return create_error_response(file_error)

            # Preemptive token count and chunking
            MAX_TOKENS = 15000  # leave room for prompt and completion
            token_count = count_tokens(text_content)
            if token_count > MAX_TOKENS:
                # Split into chunks
                chunks = chunk_text(text_content, max_tokens=MAX_TOKENS)
                analysis_results = []
                for i, chunk in enumerate(chunks):
                    try:
                        result = analyze_document_with_ai(chunk, file_extension, f"{filename} (part {i+1} of {len(chunks)})")
                        analysis_results.append(f"--- Part {i+1} of {len(chunks)} ---\n" + result)
                    except Exception as chunk_error:
                        analysis_results.append(f"Error analyzing part {i+1}: {str(chunk_error)}")
                user_message = (
                    "The document you uploaded was too large to analyze in a single pass due to ChatGPT's context window limit (16,385 tokens). "
                    "It was automatically split into smaller parts for analysis. If you need more detail, please upload a smaller section."
                )
                analysis = user_message + "\n\n" + "\n\n".join(analysis_results)
            else:
                # Analyze document with AI
                analysis = analyze_document_with_ai(text_content, file_extension, filename)
                user_message = None
            
            # Store document info (you might want to add a database model for this)
            document_info = {
                "filename": filename,
                "original_filename": file.filename,
                "file_size": os.path.getsize(file_path),
                "file_type": file_extension,
                "upload_date": os.path.getctime(file_path),
                "analysis": analysis
            }
            
            return jsonify({
                "message": "Document uploaded and analyzed successfully" if not user_message else user_message,
                "filename": filename,
                "analysis": analysis,
                "document_info": document_info
            })
            
        except Exception as processing_error:
            # Clean up file if processing fails
            if os.path.exists(file_path):
                os.remove(file_path)
            logging.error(f"Document processing error: {processing_error}")
            # Check for OpenAI context length error
            if hasattr(processing_error, 'error') and getattr(processing_error.error, 'code', None) == 'context_length_exceeded':
                return create_error_response(ValidationError(
                    "The document is too large to analyze. Please upload a shorter document or split it into smaller parts.",
                    field="document"
                ))
            file_error = FileError(
                "Failed to process document",
                operation="document_processing",
                file_path=file_path
            )
            return create_error_response(file_error)
            
    except Exception as e:
        return handle_api_error(e, "Failed to upload document")

@documents_bp.route('/documents/history', methods=['GET'])
def get_document_history():
    """Get list of uploaded documents"""
    try:
        documents = []
        
        if os.path.exists(UPLOAD_FOLDER):
            for filename in os.listdir(UPLOAD_FOLDER):
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                if os.path.isfile(file_path):
                    documents.append({
                        "filename": filename,
                        "file_size": os.path.getsize(file_path),
                        "upload_date": os.path.getctime(file_path),
                        "file_type": filename.rsplit(".", 1)[1].lower() if "." in filename else "unknown"
                    })
        
        # Sort by upload date (newest first)
        documents.sort(key=lambda x: x["upload_date"], reverse=True)
        
        return jsonify(documents)
        
    except Exception as e:
        return handle_api_error(e, "Failed to fetch document history")

@documents_bp.route('/documents/<filename>', methods=['DELETE'])
def delete_document(filename):
    """Delete an uploaded document"""
    try:
        # Secure filename to prevent directory traversal
        secure_name = secure_filename(filename)
        file_path = os.path.join(UPLOAD_FOLDER, secure_name)
        
        if not os.path.exists(file_path):
            not_found_error = NotFoundError(
                "Document not found",
                resource_type="document"
            )
            return create_error_response(not_found_error)
        
        # Check if file is actually in upload folder (security check)
        if not os.path.abspath(file_path).startswith(os.path.abspath(UPLOAD_FOLDER)):
            validation_error = ValidationError(
                "Invalid file path",
                field="filename"
            )
            return create_error_response(validation_error)
        
        os.remove(file_path)
        
        return jsonify({"message": "Document deleted successfully"})
        
    except Exception as e:
        return handle_api_error(e, "Failed to delete document")

@documents_bp.route('/documents/delete-all', methods=['DELETE'])
def delete_all_documents():
    """Delete all uploaded documents"""
    try:
        deleted_count = 0
        
        if os.path.exists(UPLOAD_FOLDER):
            for filename in os.listdir(UPLOAD_FOLDER):
                file_path = os.path.join(UPLOAD_FOLDER, filename)
                if os.path.isfile(file_path):
                    # Check if file is actually in upload folder (security check)
                    if os.path.abspath(file_path).startswith(os.path.abspath(UPLOAD_FOLDER)):
                        os.remove(file_path)
                        deleted_count += 1
        
        return jsonify({
            "message": f"Successfully deleted {deleted_count} documents",
            "deleted_count": deleted_count
        })
        
    except Exception as e:
        return handle_api_error(e, "Failed to delete all documents")

@documents_bp.route('/documents/<filename>/analyze', methods=['POST'])
def reanalyze_document(filename):
    """Re-analyze an existing document"""
    try:
        # Secure filename to prevent directory traversal
        secure_name = secure_filename(filename)
        file_path = os.path.join(UPLOAD_FOLDER, secure_name)
        
        if not os.path.exists(file_path):
            not_found_error = NotFoundError(
                "Document not found",
                resource_type="document"
            )
            return create_error_response(not_found_error)
        
        # Check if file is actually in upload folder (security check)
        if not os.path.abspath(file_path).startswith(os.path.abspath(UPLOAD_FOLDER)):
            validation_error = ValidationError(
                "Invalid file path",
                field="filename"
            )
            return create_error_response(validation_error)
        
        # Extract text based on file type
        file_extension = filename.rsplit(".", 1)[1].lower()
        
        if file_extension == "pdf":
            text_content = extract_text_from_pdf(file_path)
        elif file_extension == "txt":
            text_content = extract_text_from_txt(file_path)
        elif file_extension in ["csv", "xls", "xlsx"]:
            text_content = extract_data_from_csv(file_path)
        else:
            validation_error = ValidationError(
                "Unsupported file type",
                field="document"
            )
            return create_error_response(validation_error)
        
        if not text_content or text_content.strip() == "":
            file_error = FileError(
                "Could not extract text from document",
                operation="text_extraction",
                file_path=file_path
            )
            return create_error_response(file_error)
        
        # Analyze document with AI
        analysis = analyze_document_with_ai(text_content, file_extension, filename)
        
        return jsonify({
            "message": "Document re-analyzed successfully",
            "filename": filename,
            "analysis": analysis
        })
        
    except Exception as e:
        return handle_api_error(e, "Failed to re-analyze document") 