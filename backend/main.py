from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import cv2
import numpy as np
import asyncio
import json
from datetime import datetime
from typing import List
import base64
from ultralytics import YOLO
import torch
from database import init_db, get_db, log_incident, get_recent_incidents, get_incident_stats
from sqlalchemy.orm import Session

app = FastAPI(title="Real-Time Accident Detection API")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
model = None
detection_active = False
class ConnectedClient:
    def __init__(self, websocket: WebSocket):
        self.websocket = websocket

connected_clients: List[ConnectedClient] = []

@app.on_event("startup")
async def startup_event():
    global model
    print("Initializing database...")
    init_db()
    print("Database initialized successfully!")
    
    print("Loading YOLO model...")
    try:
        # Load YOLOv8 model (will download if not present)
        model = YOLO("yolov8n.pt")
        print("Model loaded successfully!")
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Will use basic motion detection as fallback")

@app.get("/")
async def root():
    return {"message": "Real-Time Accident Detection API", "status": "running"}

@app.get("/status")
async def get_status(db: Session = Depends(get_db)):
    stats = get_incident_stats(db)
    return {
        "detection_active": detection_active,
        "connected_clients": len(connected_clients),
        "model_loaded": model is not None,
        "incident_stats": stats
    }

@app.get("/incidents")
async def get_incidents(limit: int = 10, db: Session = Depends(get_db)):
    incidents = get_recent_incidents(db, limit)
    return {
        "incidents": [
            {
                "id": incident.id,
                "timestamp": incident.timestamp.isoformat(),
                "confidence": incident.confidence,
                "accident_detected": incident.accident_detected,
                "regions": json.loads(incident.regions) if incident.regions else [],
                "severity": incident.severity,
                "status": incident.status,
                "location": incident.location
            }
            for incident in incidents
        ]
    }

@app.put("/incidents/{incident_id}")
async def update_incident(
    incident_id: int, 
    status: str, 
    notes: str = None,
    db: Session = Depends(get_db)
):
    from database import update_incident_status as update_status
    incident = update_status(db, incident_id, status, notes)
    if incident:
        return {
            "id": incident.id,
            "status": incident.status,
            "notes": incident.notes
        }
    return JSONResponse(status_code=404, content={"message": "Incident not found"})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, db: Session = Depends(get_db)):
    await websocket.accept()
    client = ConnectedClient(websocket)
    connected_clients.append(client)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "video_frame":
                # Process video frame
                frame_data = message["data"]
                frame = decode_frame(frame_data)
                
                if frame is not None:
                    # Process frame for accident detection
                    result = process_frame(frame)
                    
                    # Log incident if accident detected
                    if result["accident_detected"] and result["confidence"] > 0.5:
                        try:
                            log_incident(db, {
                                "accident_detected": result["accident_detected"],
                                "confidence": result["confidence"],
                                "regions": result["regions"],
                                "severity": "high" if result["confidence"] > 0.8 else "medium"
                            })
                        except Exception as e:
                            print(f"Error logging incident: {e}")
                    
                    # Send result back to client
                    response = {
                        "type": "detection_result",
                        "timestamp": datetime.now().isoformat(),
                        "accident_detected": result["accident_detected"],
                        "confidence": result["confidence"],
                        "regions": result["regions"]
                    }
                    await websocket.send_text(json.dumps(response))
                    
            elif message["type"] == "start_detection":
                detection_active = True
                await websocket.send_text(json.dumps({"type": "status", "detection_active": True}))
                
            elif message["type"] == "stop_detection":
                detection_active = False
                await websocket.send_text(json.dumps({"type": "status", "detection_active": False}))
                
    except WebSocketDisconnect:
        connected_clients.remove(client)
        print(f"Client disconnected. Total clients: {len(connected_clients)}")
    except Exception as e:
        print(f"Error: {e}")
        if client in connected_clients:
            connected_clients.remove(client)

def decode_frame(frame_data: str) -> np.ndarray:
    """Decode base64 encoded frame"""
    try:
        # Remove data URL prefix if present
        if "," in frame_data:
            frame_data = frame_data.split(",")[1]
        
        # Decode base64
        img_bytes = base64.b64decode(frame_data)
        nparr = np.frombuffer(img_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return frame
    except Exception as e:
        print(f"Error decoding frame: {e}")
        return None

def process_frame(frame: np.ndarray) -> dict:
    """Process frame for accident detection"""
    result = {
        "accident_detected": False,
        "confidence": 0.0,
        "regions": []
    }
    
    if model is not None:
        try:
            # Run YOLO detection
            predictions = model(frame, verbose=False)
            
            # Analyze predictions for accident indicators
            # This is a simplified version - real implementation would be more sophisticated
            detected_objects = []
            for pred in predictions:
                boxes = pred.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    class_name = model.names[cls_id]
                    
                    detected_objects.append({
                        "class": class_name,
                        "confidence": conf,
                        "bbox": box.xyxy[0].tolist()
                    })
            
            # Simple accident detection logic
            # In real implementation, this would analyze motion patterns, vehicle positions, etc.
            accident_indicators = ["car", "truck", "bus", "motorcycle"]
            vehicle_count = sum(1 for obj in detected_objects if obj["class"] in accident_indicators)
            
            # If multiple vehicles detected with high confidence, flag as potential accident
            if vehicle_count >= 2:
                avg_confidence = sum(obj["confidence"] for obj in detected_objects) / len(detected_objects)
                result["accident_detected"] = avg_confidence > 0.6
                result["confidence"] = avg_confidence
                result["regions"] = detected_objects
                
        except Exception as e:
            print(f"Error processing frame with model: {e}")
            # Fallback to basic motion detection
            result = basic_motion_detection(frame)
    else:
        # Fallback to basic motion detection
        result = basic_motion_detection(frame)
    
    return result

def basic_motion_detection(frame: np.ndarray) -> dict:
    """Basic motion detection as fallback"""
    # Convert to grayscale
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    
    # Apply Gaussian blur
    blur = cv2.GaussianBlur(gray, (21, 21), 0)
    
    # This is a simplified version - real implementation would compare with previous frames
    # For now, return no detection
    return {
        "accident_detected": False,
        "confidence": 0.0,
        "regions": []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
