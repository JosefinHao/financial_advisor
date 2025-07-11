import pypdf
import pandas as pd
import logging
import os
import openai
from dotenv import load_dotenv
import tiktoken

# Load environment variables
load_dotenv()

def extract_text_from_pdf(file_path):
    """Extract text from PDF file"""
    try:
        with open(file_path, 'rb') as file:
            pdf_reader = pypdf.PdfReader(file)
            text = ""
            
            for page in pdf_reader.pages:
                text += page.extract_text() + "\n"
            
            return text.strip()
    except Exception as e:
        logging.error(f"Error extracting text from PDF {file_path}: {e}")
        raise

def extract_text_from_txt(file_path):
    """Extract text from TXT file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    except UnicodeDecodeError:
        # Try with different encoding if UTF-8 fails
        try:
            with open(file_path, 'r', encoding='latin-1') as file:
                return file.read().strip()
        except Exception as e:
            logging.error(f"Error extracting text from TXT {file_path}: {e}")
            raise
    except Exception as e:
        logging.error(f"Error extracting text from TXT {file_path}: {e}")
        raise

def extract_data_from_spreadsheet(file_path):
    """Extract and format data from CSV/Excel file"""
    try:
        file_extension = file_path.rsplit(".", 1)[1].lower()
        
        if file_extension == "csv":
            # Try different encodings for CSV
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    df = pd.read_csv(file_path, encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise ValueError("Could not decode CSV file with any supported encoding")
        elif file_extension in ["xls", "xlsx"]:
            try:
                df = pd.read_excel(file_path)
            except ImportError:
                raise ImportError("pandas or openpyxl is required to read Excel files")
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")
        
        # Convert DataFrame to formatted text
        text_content = f"File: {os.path.basename(file_path)}\n"
        text_content += f"Shape: {df.shape[0]} rows, {df.shape[1]} columns\n\n"
        
        # Add column names
        text_content += "Columns:\n"
        for i, col in enumerate(df.columns, 1):
            text_content += f"{i}. {col}\n"
        
        text_content += "\nData Preview:\n"
        text_content += df.head(10).to_string(index=False)
        
        # Add summary statistics for numeric columns
        numeric_cols = df.select_dtypes(include=['number']).columns
        if len(numeric_cols) > 0:
            text_content += "\n\nSummary Statistics:\n"
            text_content += df[numeric_cols].describe().to_string()
        
        return text_content
        
    except Exception as e:
        logging.error(f"Error extracting data from file {file_path}: {e}")
        raise

# Keep the old function name for backward compatibility
def extract_data_from_csv(file_path):
    """Alias for extract_data_from_spreadsheet for backward compatibility"""
    return extract_data_from_spreadsheet(file_path)

def analyze_document_with_ai(text_content, file_type, filename):
    """Analyze document content using OpenAI"""
    try:
        openai.api_key = os.getenv("OPENAI_API_KEY")
        
        # Create analysis prompt based on file type
        if file_type == "csv" or file_type in ["xls", "xlsx"]:
            prompt = f"""Analyze this financial data from {filename} and provide insights:

{text_content}

Please provide:
1. Key financial metrics and trends
2. Potential areas of concern or opportunity
3. Recommendations for financial planning
4. Summary of the data structure and quality

Format your response in a clear, structured manner."""
        else:
            prompt = f"""Analyze this financial document ({filename}) and provide insights:

{text_content}

Please provide:
1. Summary of the document content
2. Key financial information extracted
3. Potential implications or recommendations
4. Any important dates, amounts, or terms mentioned

Format your response in a clear, structured manner."""
        
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a financial advisor analyzing documents. Provide clear, actionable insights."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        return response.choices[0].message.content
        
    except Exception as e:
        logging.error(f"Error analyzing document with AI: {e}")
        return f"Error analyzing document: {str(e)}"

def validate_document_content(text_content, min_length=10):
    """Validate that extracted document content is meaningful"""
    if not text_content or len(text_content.strip()) < min_length:
        return False, "Document content is too short or empty"
    
    # Check if content contains meaningful text (not just whitespace/special characters)
    meaningful_chars = sum(1 for char in text_content if char.isalnum())
    if meaningful_chars < min_length:
        return False, "Document contains insufficient meaningful content"
    
    return True, "Content is valid"

def sanitize_filename(filename):
    """Sanitize filename for safe storage"""
    import re
    # Remove or replace unsafe characters
    safe_filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    # Limit length
    if len(safe_filename) > 255:
        name, ext = os.path.splitext(safe_filename)
        safe_filename = name[:255-len(ext)] + ext
    return safe_filename 

def count_tokens(text, model="gpt-3.5-turbo"):
    enc = tiktoken.encoding_for_model(model)
    return len(enc.encode(text))

def chunk_text(text, max_tokens=15000, model="gpt-3.5-turbo"):
    enc = tiktoken.encoding_for_model(model)
    tokens = enc.encode(text)
    chunks = []
    for i in range(0, len(tokens), max_tokens):
        chunk = enc.decode(tokens[i:i+max_tokens])
        chunks.append(chunk)
    return chunks 