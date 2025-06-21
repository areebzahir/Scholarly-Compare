from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient


app = Flask(__name__)
CORS(app)  # enable CORS for all routes

server = MongoClient("mongodb+srv://navinsethi2006:Tigernav6(@cluster0.vlnjg2t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

db = server["Scholar-Compare"]
student_data = db["Student Data"]
answer_data = db["Answers Data"]
login_data = db["Login"]

@app.route("/api/users", methods=["GET"])
def get_users():
    users = "i hate biggers"
    return jsonify(users)

@app.route("/api/answerdata", methods=["GET"])
def get_string():
    data = request.get_json()
    message = data.get("message")
    print(message)


@app.route("/api/file", methods=["GET"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part in the request"}), 400

    file = request.files["file"]

    print(file.read())


if __name__ == "__main__":
    app.run(debug=True, port=5000)