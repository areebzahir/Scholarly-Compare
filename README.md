# Scholar Compare - AI-Powered Answer Evaluation System

![IntelliGrade Demo](https://i.imgur.com/gif-placeholder.gif)  
*Real-time student answer evaluation with AI feedback*

## Table of Contents
- [Introduction](#introduction)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)

## Introduction
Scholar Compare is an AI-powered platform that revolutionizes how educators evaluate student answers. By leveraging LLMs, our system provides instant semantic analysis of student responses compared to a model answer, saving teachers hours of grading time while delivering personalized feedback.

**Key Benefits:**
- ⏱️ Reduces grading time by 75% (estimate)
- 🧠 Understands context and meaning, not just keywords
- 📊 Provides actionable insights into student understanding
- 📚 Preserves evaluation history for progress tracking

## Features
- **AI-Powered Evaluation**  
  Semantic analysis using Google's Gemini API
- **CSV Batch Processing**  
  Upload and evaluate entire classes in seconds
- **Evaluation History** 
  Save previous evaluations and export the data.
- **Detailed Feedback** for each student 
  Identify conceptual gaps and knowledge strengths
- **Responsive Design**  
  Works on a variety of screen sizes 

## Technology Stack

### Frontend
| Technology   | Purpose                      |
| ------------ | ---------------------------- |
| React 18     | Component-based UI           |
| TypeScript   | Type-safe JavaScript         |
| Tailwind CSS | Utility-first styling        |
| React Router | Navigation and routing       |

### Backend
| Technology    | Purpose                       |
| ------------- | ----------------------------- |
| Python 3.10   | Backend logic                 |
| Flask         | REST API framework            |
| Flask-CORS    | Cross-Origin Resource Sharing |
| PyMongo       | MongoDB database driver       |
| python-dotenv | Environment configuration     |

### Database
| Technology    | Purpose                     |
| ------------- | --------------------------- |
| MongoDB       | Document-based data storage |

### AI Services
| Service           | Purpose                  |
| ----------------- | ------------------------ |
| Google Gemini API | Semantic answer analysis |

## Installation

### Prerequisites
- Node.js 18.x
- Python 3.10
- MongoDB Atlas account
- Google Cloud account with Gemini API access
### Backend Setup
```bash
# Navigate to backend directory
cd ../backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/MacOS
venv\Scripts\activate     # Windows

# Install dependencies
pip flask flask-cors pymongo

# Start Flask server
python app.py
```

### Frontend Setup
```bash
# Clone repository
git clone https://github.com/your-username/intelligrade.git
cd intelligrade/frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Then press on the link that shows up on your terminal.
