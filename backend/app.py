from flask import Flask, request, jsonify, send_from_directory
import requests
import os
import re
from dotenv import load_dotenv
load_dotenv()  # Load environment variables
from flask_cors import CORS
from openai import OpenAI, AssistantEventHandler
from typing_extensions import override
import time
import base64
import pyttsx3

app = Flask(__name__, static_folder='../frontend/build', static_url_path='/')
CORS(app)  # Enable CORS for all routes and origins

client = OpenAI(
    # This is the default and can be omitted
    api_key=os.environ.get("OPENAI_API_KEY"),
    # default_headers={"OpenAI-Beta": "assistants=v1"}
)
# ASSISTANT_ID="asst_Vsh2apH1xFtr6he53K625VtU";
ASSISTANT_ID = os.environ.get("ASSISTANT_ID")

IMAGE_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'images')
# print(IMAGE_FOLDER)

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def static_files(path):
    return send_from_directory(app.static_folder, path)

@app.route('/', methods=['GET'])
def index():
    return "Hello, World from the Flask Backend 🐍🧪!"

@app.route('/gpt4assist-query', methods=['POST'])
def assist_query():
    data = request.json
    user_query = data.get("input")
    enable_tts = data.get("enable_tts", False)  # get the enable_tts flag from the frontend

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
                            response_obj = {"type": "text", "content": content_block.text.value}
                            if enable_tts:
                                # Generate audio file using pyttsx3
                                engine = pyttsx3.init()
                                audio_filename = f"{msg.id}.mp3"
                                audio_path = os.path.join(IMAGE_FOLDER, audio_filename)
                                engine.save_to_file(content_block.text.value, audio_path)
                                engine.runAndWait()
                                response_obj["audio"] = f"/images/{audio_filename}"
                            assistant_responses.append(response_obj)                        
                        elif content_block.type == 'image_file':
                            print("Found an image file:", content_block)  # Debug output
                            if hasattr(content_block.image_file, 'file_id'):
                                image_file_id = content_block.image_file.file_id
                                print("Image file ID:", image_file_id)  # Debug output
                                # Download and save the image file
                                image_file = client.files.content(image_file_id)
                                image_filename = f"{image_file_id}.png"
                                image_path = os.path.join(IMAGE_FOLDER, image_filename)
                                with open(image_path, "wb") as f:
                                    f.write(image_file.content)

                                # Construct the URL for the image
                                image_url = f"/images/{image_filename}"
                                print("Image URL:", image_url)  # Debug output
                                assistant_responses.append({"type": "image", "content": image_url})
                            else:
                                print("Image file ID not found in the response")  # Debug output

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
    
@app.route('/wgpt4assist-query', methods=['POST'])
def daisy_chain_query():
    user_input = request.json.get("input")
    wolfram_appid = os.getenv('WOLFRAM_APPID')
    wolfram_response = requests.get(
        "https://www.wolframalpha.com/api/v1/llm-api",
        params={"input": user_input, "appid": wolfram_appid}
    )

    if wolfram_response.status_code == 200:
        wolfram_text = wolfram_response.text
        try:
            thread = client.beta.threads.create()
            run = client.beta.threads.runs.create(
                thread_id=thread.id,
                assistant_id=ASSISTANT_ID,
                instructions=f"Please assist with the following query, using the provided Wolfram Alpha response:\n\nUser query: {user_input}\n\nWolfram Alpha response: {wolfram_text}"
            )

            while run.status in ['queued', 'in_progress', 'cancelling']:
                time.sleep(1)
                run = client.beta.threads.runs.retrieve(
                    thread_id=thread.id,
                    run_id=run.id
                )

            if run.status == 'completed':
                messages = client.beta.threads.messages.list(thread_id=thread.id)
                assistant_response = ""
                image_url = None
                for msg in messages.data:
                    if msg.role == 'assistant':
                        for content_block in msg.content:
                            if content_block.type == 'text' and hasattr(content_block.text, 'value'):
                                text = content_block.text.value
                                assistant_response += text + "\n"
                                # Improved URL extraction
                                match = re.search(r'https?://[^\s)]+/MSP/MSP[^\s)]+\?MSPStoreType=image/(?:png|jpg|jpeg|gif)(?:&[^\s)]+)?', text)
                                if match:
                                    image_url = match.group(0)  # Directly use the matched URL
                                    print(image_url)

                return jsonify({"response": assistant_response.strip(), "image_url": image_url})
            else:
                return jsonify({"error": f"Run did not complete successfully, status: {run.status}"}), 500

        except Exception as e:
            print(f"An error occurred: {str(e)}")
            return jsonify({"error": "An unexpected error occurred. Please try again later."}), 500

    else:
        return jsonify({"error": "Failed to fetch data from the Wolfram API"}), wolfram_response.status_code
    
if __name__ == "__main__":
    app.run(debug=True)

# @app.route('/gpt4-query', methods=['POST'])
# def gpt_chat():
#     data = request.json
#     user_input = data.get("input")

#     try:
#         response = client.chat.completions.create(
#             messages=[
#                 {"role": "user", "content": user_input}
#             ],
#             model="gpt-4-0125-preview",  # Adjust the model as needed
#             temperature=1,
#             max_tokens=256,
#             top_p=1,
#             frequency_penalty=0,
#             presence_penalty=0
#         )
#         print(response)
#         # Accessing the message content (if the new structure is as assumed)
#         if response and response.choices: 
#             message_content = response.choices[0].message.content
#             return jsonify({"response": message_content})
#         else:
#             return jsonify({"error": "No response from GPT-4"}), 500
#     except Exception as e:
#         print(f"Error calling OpenAI GPT-4: {e}")
#         return jsonify({"error": "Failed to fetch response from GPT-4"}), 500