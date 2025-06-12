from flask import Blueprint, request, jsonify
from app.services.chat import get_chat_response
from app.services.taxes import calculate_tax

main = Blueprint('main', __name__)

@main.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message")
    response = get_chat_response(user_input)
    return jsonify({"response": response})

@main.route("/tax", methods=["POST"])
def tax():
    income = request.json.get("income")
    tax_info = calculate_tax(income)
    return jsonify(tax_info)
