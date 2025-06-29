import os
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

print("Testing OpenAI client instantiation...")

try:
    # Test 1: Basic instantiation
    print("Test 1: Basic OpenAI client instantiation")
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    print("✓ Basic instantiation successful")
    
    # Test 2: Try to create a completion
    print("Test 2: Creating a simple completion")
    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Hello"}],
        max_tokens=10
    )
    print("✓ Completion successful")
    print(f"Response: {response.choices[0].message.content}")
    
except Exception as e:
    print(f"✗ Error: {e}")
    print(f"Error type: {type(e)}")
    import traceback
    traceback.print_exc() 