import requests
import json

def test_math_formatting():
    # Test the streaming endpoint with a math question
    url = "http://127.0.0.1:5000/api/v1/conversations/3/stream"
    headers = {"Content-Type": "application/json"}
    data = {"message": "How to calculate mortgage payments? Please show the formula."}
    
    print("Testing math formula formatting...")
    print(f"URL: {url}")
    print(f"Data: {data}")
    print("-" * 50)
    
    try:
        response = requests.post(url, headers=headers, json=data, stream=True)
        
        if response.status_code == 200:
            print("Streaming response received:")
            print("-" * 50)
            
            full_response = ""
            for line in response.iter_lines():
                if line:
                    line_str = line.decode('utf-8')
                    if line_str.startswith('data: '):
                        data_content = line_str[6:]  # Remove 'data: ' prefix
                        if data_content == '[DONE]':
                            break
                        try:
                            chunk_data = json.loads(data_content)
                            if 'content' in chunk_data:
                                chunk = chunk_data['content']
                                full_response += chunk
                                print(chunk, end='', flush=True)
                        except json.JSONDecodeError:
                            continue
            
            print("\n" + "-" * 50)
            print("Full response:")
            print(full_response)
            
        else:
            print(f"Error: {response.status_code}")
            print(response.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_math_formatting() 