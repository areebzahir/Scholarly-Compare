from pymongo import *

server = MongoClient("mongodb+srv://navinsethi2006:Tigernav6(@cluster0.vlnjg2t.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0")

db = server("Scholar-Compare")
student_data = db["Student Data"]
answer_data = db["Answers Data"]
login_data = db["Login"]