
# Facial Recognition System

## Overview

This module implements a real-time facial recognition system using OpenCV and PyTorch. It captures images, recognizes faces from a pre-registered database, and logs detected individuals with timestamps. The system also manages session duration to prevent duplicate logging within a set period, and allows configuration of session duration based on user requirements.

## Features

-   **Face Detection & Recognition**: Uses MTCNN for face detection and FaceNet (InceptionResnetV1) for face recognition.
-   **Face Capturing**: Automatically captures and stores detected faces with timestamps.
-   **Logging**: Stores recognized faces and timestamps in `face_log.txt`.
-   **Session Duration Management**: Faces are tracked for a configurable time period to avoid duplicate logging.
-   **Real-Time Processing**: Runs continuously using a live camera feed.

## Folder Structure

```
Facial Recognition/
│── face_recog_demo.py        # Main script for face recognition
│── requirements.txt          # Dependencies for the project
│── captured_photo/           # Folder to store captured face images
│── registered_photo/         # Folder for pre-registered faces
│   ├── Alvin Tran.jpg
│   ├── Boan Li.jpg
│   ├── Nathaniel Sullivan.jpg
│   ├── Zhiguo Ren.jpg
│── face_log.txt              # Log file for recognized faces

```

## Installation

1.  **Clone the Repository**
    
    ```sh
    git clone <repository-url>
    cd Facial Recognition
    
    ```
    
2.  **Set up a Virtual Environment** (Optional but recommended)
    
    ```sh
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    
    ```
    
3.  **Install Dependencies**
    
    ```sh
    pip install -r requirements.txt
    
    ```
    

## Running the Program

```sh
python face_recog_demo.py

```

## Output Files

-   **Captured Faces**: Stored in `captured_photo/` with timestamps.
-   **Face Log**: Stores recognized faces with timestamps in `face_log.txt`.
-   **Live Camera Feed**: Displays real-time face recognition results.

## Dependencies (requirements.txt)

```
facenet_pytorch==2.5.3
torch==2.6.0
opencv-python==4.11.0.86
Pillow==11.1.0
numpy==2.2.3

```

## How It Works

1.  **Registers Faces**: Loads pre-registered face images.
2.  **Captures Live Video**: Uses OpenCV to access the camera.
3.  **Detects & Recognizes Faces**:
    -   Detects faces using MTCNN.
    -   Extracts embeddings using FaceNet.
    -   Compares embeddings with the database.
    -   Assigns a name or marks as "Unknown".
4.  **Stores & Logs Results:**
    -   **Captures an image of the detected face** and saves it in `captured_photo/` with a timestamp.
    -   **Logs recognition results** in `face_log.txt`.
5.  **Manages Session Duration**:
    -   Keeps track of seen faces for a configurable period (`SESSION_DURATION`).
    -   Prevents duplicate logging within this timeframe.
    -   Periodically resets the session to allow re-logging after expiry.

## Notes

-   Ensure that `registered_photo/` contains images of known individuals.
-   Adjust the recognition threshold if accuracy needs improvement.
-   Modify `SESSION_DURATION` in `face_recog_demo.py` to set the desired session time.
