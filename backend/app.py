from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/', methods=['GET'])
def index():
    return "Hello, World from the Flask Backend 🐍🧪!"

@app.route('/query', methods=['POST'])
def query():
    data = request.json
    # Example of calling an external API, adjust according to the API you're using
    api_url = "API_URL"  # Replace with the actual API URL
    headers = {
        "Authorization": "Bearer API_KEY",  # Replace with the actual API key
        "Content-Type": "application/json",
    }
    # Assuming the data sent to this endpoint is what you want to forward to the API
    response = requests.post(api_url, json=data, headers=headers)
    
    if response.status_code == 200:
        # Forward the successful response from the API back to the client
        return jsonify(response.json())
    else:
        # Handle errors or unsuccessful responses
        return jsonify({"error": "Failed to fetch data from the external API"}), 500

if __name__ == "__main__":
    app.run(debug=True)