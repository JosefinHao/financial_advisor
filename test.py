import requests

# Test /chat
chat_resp = requests.post("http://127.0.0.1:5000/chat", json={"message": "How to budget monthly?"})
print("Chat Response:", chat_resp.json())

# Test /tax
tax_resp = requests.post("http://127.0.0.1:5000/tax", json={"income": 85000})
print("Tax Response:", tax_resp.json())
