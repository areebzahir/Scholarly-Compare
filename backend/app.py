from flask import Flask, request, jsonify
from pymongo.server_api import ServerApi
from flask_cors import CORS
from pymongo import MongoClient
import csv
import gridfs

app = Flask(__name__)
CORS(app)

# MongoDB setup
uri = "mongodb+srv://navinsethi2006:Tigernav69@cluster0.vlnjg2t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"

client = MongoClient(uri,server_api=ServerApi('1'))
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)
db = client["Scholar-Compare"]
student_data = db["Student Data"]
answer_data = db["Answer Data"]
fs = gridfs.GridFS(db)  # For file storage

@app.route("/api/answerdata", methods=["POST"])
def save_answer():
    data = request.get_json()
    correct_answer = data.get("correctAnswer")
    
    if not correct_answer:
        return jsonify({"error": "Missing correct answer"}), 400
    
    # Store in MongoDB
    answer_data.insert_one({
        "Correct Answer": correct_answer,
    })
    


    return jsonify({"message": "Correct answer saved"}), 200

@app.route("/api/file", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Read and parse CSV file
        csv_data = file.read().decode('utf-8')
        reader = csv.DictReader(csv_data.splitlines())
        
        # Process CSV rows
        students = []
        for row in reader:
            # Create student document
            student = {
                "filename": file.filename,
            }
            
            # Add all columns from CSV
            for key, value in row.items():
                # Clean up column names
                clean_key = key.strip().lower().replace(' ', '_')
                student[clean_key] = value.strip()
            
            students.append(student)
        
        # Insert into MongoDB
        if students:
            result = student_data.insert_many(students)
            return jsonify({
                "message": "File contents stored successfully",
                "filename": file.filename,
                "students_inserted": len(result.inserted_ids),
                "sample": students[0]  # Return first student as sample
            }), 200
        else:
            return jsonify({"error": "CSV file is empty"}), 400
            
    except Exception as e:
        return jsonify({
            "error": "Failed to process file",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)