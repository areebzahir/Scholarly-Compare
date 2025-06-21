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
    
    try:
        # Check for existing answer with exact match
        existing = answer_data.find_one({"correct_answer": correct_answer})
        
        if existing:
            return jsonify({
                "message": "Answer already exists",
            }), 200
        
        # Store in MongoDB
        result = answer_data.insert_one({
            "correct_answer": correct_answer,
        })
        
        return jsonify({
            "message": "Correct answer saved",
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to save answer",
            "details": str(e)
        }), 500

@app.route("/api/file", methods=["POST"])
def upload_file():
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Read and parse CSV file
        csv_data = file.stream.read().decode('utf-8')
        file.stream.seek(0)  # Reset file pointer
        reader = csv.DictReader(csv_data.splitlines())
        
        # Process CSV rows
        students = []
        names_in_file = set()  # Track names within current file
        
        for row in reader:
            # Extract and clean name
            name = None
            for key in ['name', 'student', 'student name', 'full name']:
                if key in row:
                    name = row[key].strip()
                    break
            
            if not name:
                # Skip rows without name
                continue
                
            # Check for duplicate name IN CURRENT FILE
            if name in names_in_file:
                continue
            names_in_file.add(name)
            
            # Create student document
            student = {
                "filename": file.filename,
                "name": name,
            }
            
            # Add all columns from CSV
            for key, value in row.items():
                # Clean up column names
                clean_key = key.strip().lower().replace(' ', '_')
                student[clean_key] = value.strip()
            
            students.append(student)
        
        # Insert into MongoDB with duplicate name checking
        inserted_count = 0
        duplicates = 0
        
        for student in students:
            # Check for existing student with same name and file
            existing = student_data.find_one({
                "name": student["name"],
            })
            
            if not existing:
                student_data.insert_one(student)
                inserted_count += 1
            else:
                duplicates += 1
        
        # Store file in GridFS if we have new students
  
        return jsonify({
            "message": "File processed successfully",
            "students_inserted": inserted_count,
            "duplicates_skipped": duplicates,
        }), 200
        
    except Exception as e:
        return jsonify({
            "error": "Failed to process file",
            "details": str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True, port=5000)