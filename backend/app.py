from flask import Flask, request, jsonify
import requests
import os
from dotenv import load_dotenv
from flask_cors import CORS
from openai import OpenAI, AssistantEventHandler
from typing_extensions import override

client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
)
ASSISTANT_ID = os.environ.get("ASSISTANT_ID")
load_dotenv()  # Load environment variables

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes and origins

IMAGE_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images')

@app.route('/', methods=['GET'])
def index():
    return "Hello, World from the Flask Backend 🐍🧪!"

import time
import base64
@app.route('/assist-query', methods=['POST'])
def assist_query():
    data = request.json
    user_query = data.get("input")

    try:
        thread = client.beta.threads.create()

        run = client.beta.threads.runs.create(
            thread_id=thread.id,
            assistant_id=ASSISTANT_ID,
            instructions=f"Please assist with: {user_query}"
        )

        while run.status in ['queued', 'in_progress', 'cancelling']:
            time.sleep(1)
            run = client.beta.threads.runs.retrieve(
                thread_id=thread.id,
                run_id=run.id
            )

        if run.status == 'completed':
            messages = client.beta.threads.messages.list(thread_id=thread.id)
            assistant_responses = []
            for msg in messages.data:
                if msg.role == 'assistant':
                    for content_block in msg.content:
                        if content_block.type == 'text' and hasattr(content_block.text, 'value'):
                            print("Found an assistant message:", content_block.text.value)  # Debug output
                            assistant_responses.append({"type": "text", "content": content_block.text.value})
                        elif content_block.type == 'image_file':
                            # Download and save the image file
                            image_file_id = content_block.image_file.file_id
                            image_file = client.files.content(image_file_id)
                            image_filename = f"{image_file_id}.png"
                            image_path = os.path.join(IMAGE_FOLDER, image_filename)
                            with open(image_path, "wb") as f:
                                f.write(image_file.content)

                            # Construct the URL for the image
                            image_url = f"/images/{image_filename}"
                            print("Image URL:", image_url)  # Debug output
                            assistant_responses.append({"type": "image", "content": image_url})

            return jsonify({"responses": assistant_responses})
        else:
            return jsonify({"error": f"Run did not complete successfully, status: {run.status}"}), 500

    except Exception as e:
        print(f"An error occurred: {str(e)}")
        return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

from flask import send_from_directory

@app.route('/images/<filename>')
def serve_image(filename):
    return send_from_directory(IMAGE_FOLDER, filename)
                    
@app.route('/gpt4-query', methods=['POST'])
def gpt_chat():
    data = request.json
    user_input = data.get("input")

    try:
        response = client.chat.completions.create(
            messages=[
                {"role": "user", "content": user_input}
            ],
            model="gpt-4-0125-preview",  # Adjust the model as needed
            temperature=1,
            max_tokens=256,
            top_p=1,
            frequency_penalty=0,
            presence_penalty=0
        )
        print(response)
        # Accessing the message content (if the new structure is as assumed)
        if response and response.choices: 
            message_content = response.choices[0].message.content
            return jsonify({"response": message_content})
        else:
            return jsonify({"error": "No response from GPT-4"}), 500
    except Exception as e:
        print(f"Error calling OpenAI GPT-4: {e}")
        return jsonify({"error": "Failed to fetch response from GPT-4"}), 500
    
@app.route('/wolframquery', methods=['POST'])
def query():
    data = request.json
    api_url = "https://www.wolframalpha.com/api/v1/llm-api"
    params = {
        "input": data.get("input"),
        "appid": os.getenv('WOLFRAM_APPID'),
    }
    response = requests.get(api_url, params=params)
    
    if response.status_code == 200:
        # Check if the response is plain text and handle accordingly
        if 'text/plain' in response.headers.get('Content-Type', ''):
            # Return the plain text response directly
            # Wrapping the text response in a JSON object for consistent API response structure
            return jsonify({"response": response.text})
        else:
            # If the response happens to be JSON or any other format you wish to handle differently
            return jsonify(response.json())
    else:
        return jsonify({"error": "Failed to fetch data from the Wolfram API"}), response.status_code
    
@app.route('/wgpt4-query', methods=['POST'])
def daisy_chain_query():
    user_input = request.json.get("input")
    wolfram_appid = os.getenv('WOLFRAM_APPID')
    wolfram_response = requests.get(
        "https://www.wolframalpha.com/api/v1/llm-api",
        params={"input": user_input, "appid": wolfram_appid}
    )

    if wolfram_response.status_code == 200:
        wolfram_text = wolfram_response.text
        # Now, use the Wolfram response as part of the input to the OpenAI model
        try:
            openai_response = openai.ChatCompletion.create(
                model="gpt-4-0125-preview",  # Adjust the model as per your requirement
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": user_input},
                    {"role": "assistant", "content": wolfram_text},
                ],
                temperature=1,
                max_tokens=256
            )
            return jsonify({"response": openai_response.choices[0].message["content"]})
        except Exception as e:
            print(e)
            return jsonify({"error": "Failed to process with OpenAI"}), 500
    else:
        return jsonify({"error": "Failed to fetch data from the Wolfram API"}), wolfram_response.status_code

if __name__ == "__main__":
    app.run(debug=True)