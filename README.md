# Real-Time Accident Detection Using CCTV

A web application for real-time accident detection using CCTV footage with computer vision and machine learning.

## Features

- **Real-time Video Processing**: Live video feed processing using WebSockets
- **AI-Powered Detection**: YOLOv8 object detection for identifying vehicles and potential accidents
- **Dashboard Interface**: React-based frontend with live monitoring and statistics
- **Alert System**: Real-time alerts when accidents are detected
- **Database Logging**: SQLite database for logging incidents and statistics
- **Responsive Design**: Modern UI built with Tailwind CSS

## Architecture

- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI (Python) with WebSocket support
- **Computer Vision**: OpenCV and YOLOv8 (Ultralytics)
- **Database**: SQLite with SQLAlchemy ORM

## Prerequisites

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- Webcam access (for testing with live video)

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Start the backend server:
```bash
python main.py
```

The backend will start on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## Usage

1. Start both the backend and frontend servers as described above
2. Open your browser and navigate to `http://localhost:3000`
3. Click "Connect to Server" to establish WebSocket connection
4. Click "Start Camera" to enable webcam access
5. Click "Start Detection" to begin real-time accident detection
6. Monitor the dashboard for alerts and statistics

## API Endpoints

### WebSocket
- `ws://localhost:8000/ws` - WebSocket endpoint for real-time video processing

### HTTP Endpoints
- `GET /` - API status
- `GET /status` - System status and statistics
- `GET /incidents` - Retrieve recent incidents
- `PUT /incidents/{incident_id}` - Update incident status

## WebSocket Message Format

### Client to Server

**Send Video Frame:**
```json
{
  "type": "video_frame",
  "data": "base64_encoded_image_data"
}
```

**Start Detection:**
```json
{
  "type": "start_detection"
}
```

**Stop Detection:**
```json
{
  "type": "stop_detection"
}
```

### Server to Client

**Detection Result:**
```json
{
  "type": "detection_result",
  "timestamp": "2024-01-01T12:00:00",
  "accident_detected": true,
  "confidence": 0.85,
  "regions": [
    {
      "class": "car",
      "confidence": 0.92,
      "bbox": [x1, y1, x2, y2]
    }
  ]
}
```

**Status Update:**
```json
{
  "type": "status",
  "detection_active": true
}
```

## Database Schema

### Incidents Table
- `id`: Primary key
- `timestamp`: Detection timestamp
- `confidence`: Detection confidence score (0-1)
- `accident_detected`: Boolean flag
- `regions`: JSON string of detected objects
- `severity`: Incident severity (low/medium/high)
- `status`: Incident status (new/acknowledged/resolved)
- `location`: Optional location information
- `notes`: Optional notes
- `created_at`: Record creation time
- `updated_at`: Last update time

### System Stats Table
- `id`: Primary key
- `timestamp`: Stat timestamp
- `total_detections`: Total detection count
- `high_confidence_detections`: High confidence detection count
- `active_clients`: Number of active WebSocket clients
- `uptime_seconds`: System uptime in seconds

## Configuration

### Backend Configuration

Edit `backend/main.py` to modify:
- WebSocket host and port
- Model selection (yolov8n.pt, yolov8s.pt, etc.)
- Detection thresholds
- Database connection string

### Frontend Configuration

Edit `frontend/src/hooks/useWebSocket.js` to modify:
- WebSocket URL
- Reconnection settings
- Frame capture interval

## Model Information

The system uses YOLOv8 (You Only Look Once) for object detection:
- **Default Model**: yolov8n.pt (Nano version, fastest)
- **Alternative Models**: yolov8s.pt (Small), yolov8m.pt (Medium), yolov8l.pt (Large)

Models are automatically downloaded on first run from Ultralytics hub.

## Performance Optimization

- Use yolov8n.pt for real-time applications with limited resources
- Adjust frame capture interval in frontend to balance performance and accuracy
- Consider GPU acceleration for production deployments
- Implement frame skipping for high-resolution video feeds

## Troubleshooting

### Camera Access Issues
- Ensure browser camera permissions are granted
- Check if another application is using the camera
- Try using HTTPS instead of HTTP (required for camera access in some browsers)

### Model Loading Issues
- Ensure stable internet connection for initial model download
- Check if PyTorch is properly installed
- Verify system meets hardware requirements

### WebSocket Connection Issues
- Verify backend server is running
- Check firewall settings
- Ensure correct WebSocket URL in frontend configuration

### Database Issues
- Delete `accident_detection.db` to reset database
- Check file permissions for database directory
- Verify SQLAlchemy is properly installed

## Future Enhancements

- [ ] Support for multiple camera feeds
- [ ] Advanced accident detection algorithms
- [ ] Email/SMS alert notifications
- [ ] Video recording and playback
- [ ] User authentication and authorization
- [ ] Geographic location mapping
- [ ] Integration with emergency services
- [ ] Mobile application support
- [ ] Cloud deployment options
- [ ] Custom model training interface

## License

This project is provided as-is for educational and research purposes.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Disclaimer

This system is for demonstration purposes. Real-world accident detection systems require additional validation, testing, and compliance with local regulations.
