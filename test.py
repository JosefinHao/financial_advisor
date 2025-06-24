import os
import requests

BASE_URL = os.getenv("TEST_BASE_URL", "http://127.0.0.1:5000/api/v1")

def test_health_check():
    resp = requests.get("http://127.0.0.1:5000/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] in ["ok", "degraded"]

def test_create_conversation():
    resp = requests.post(f"{BASE_URL}/conversations", json={"title": "Test Chat"})
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data and data["title"] == "Test Chat"
    global conversation_id
    conversation_id = data["id"]

def test_send_message():
    # Use the conversation created above
    msg = {"message": "How do I start investing?"}
    resp = requests.post(f"{BASE_URL}/conversations/{conversation_id}", json=msg)
    assert resp.status_code == 200
    data = resp.json()
    assert "reply" in data

def test_get_conversations():
    resp = requests.get(f"{BASE_URL}/conversations")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)

def test_calculators_retirement():
    payload = {
        "current_age": 30,
        "retirement_age": 65,
        "current_savings": 10000,
        "monthly_contribution": 500,
        "expected_return": 7
    }
    resp = requests.post(f"{BASE_URL}/calculators/retirement", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "projected_savings" in data

def test_calculators_mortgage():
    payload = {
        "loan_amount": 300000,
        "interest_rate": 3.5,
        "loan_term": 30
    }
    resp = requests.post(f"{BASE_URL}/calculators/mortgage", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "monthly_payment" in data

def test_calculators_compound_interest():
    payload = {
        "principal": 10000,
        "interest_rate": 5,
        "time_period": 10,
        "compounding_frequency": "annually"
    }
    resp = requests.post(f"{BASE_URL}/calculators/compound-interest", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "final_amount" in data 