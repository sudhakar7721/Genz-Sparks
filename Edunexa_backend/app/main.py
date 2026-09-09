from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Create FastAPI application
app = FastAPI()

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Home / test API
@app.get("/")
def home():
    return {
        "message": "Python FastAPI backend is running successfully!"
    }


# API for frontend GET request
@app.get("/api/message")
def get_message():
    return {
        "success": True,
        "message": "Frontend connected to Python backend successfully!"
    }


# API for frontend POST request
@app.post("/api/user")
def create_user(data: dict):

    name = data.get("name", "User")

    return {
        "success": True,
        "message": f"Hello {name}! Python backend received your data."
    }