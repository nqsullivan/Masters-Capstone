import cv2
import os
import time
import numpy as np
from datetime import datetime
import torch
from PIL import Image
from facenet_pytorch import InceptionResnetV1, MTCNN

##############################################
# Initialization
##############################################

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
mtcnn = MTCNN(keep_all=True, device=device)
resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)

# Load precomputed embeddings
EMBEDDINGS_FILE = "precomputed_data/embeddings.npy"
database_embeddings = np.load(EMBEDDINGS_FILE, allow_pickle=True).item()
for name, emb in database_embeddings.items():
    emb_tensor = torch.tensor(emb, dtype=torch.float).to(device)
    if emb_tensor.dim() == 1:
        emb_tensor = emb_tensor.unsqueeze(0)
    database_embeddings[name] = emb_tensor

# Directories
RAW_PIC_DIR = "RawPic"
CAPTURED_PHOTO_DIR = "captured_photo"
FRED_PIC_DIR = "FRedPic"
LOG_FILE = "face_log.txt"

for d in [RAW_PIC_DIR, CAPTURED_PHOTO_DIR, FRED_PIC_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

WAIT_TIME = 300  # 5 minutes
last_trigger_time = 0.0

##############################################
# Utility Functions
##############################################

def capture_image():
    """
    Captures one frame from the camera and saves it to RawPic/ with
    filename 'mmddyyyy_hhmmss.jpg'. Returns the file path.
    """
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("⚠️ Camera not opened.")
        return None
    
    ret, frame = cap.read()
    cap.release()
    if not ret:
        print("⚠️ Failed to read from camera.")
        return None
    
    timestamp_str = datetime.now().strftime("%m%d%Y_%H%M%S")
    filename = f"{timestamp_str}.jpg"
    filepath = os.path.join(RAW_PIC_DIR, filename)
    cv2.imwrite(filepath, frame)
    print(f"✅ Captured image: {filepath}")
    return filepath

def run_face_recognition_on_rawpics():
    """
    Runs face detection & recognition on all images in RawPic/.
    Moves processed images to FRedPic/ afterwards.
    """
    for fname in os.listdir(RAW_PIC_DIR):
        if not fname.lower().endswith((".jpg", ".png")):
            continue
        
        raw_path = os.path.join(RAW_PIC_DIR, fname)
        # Load image
        frame = cv2.imread(raw_path)
        if frame is None:
            print(f"⚠️ Could not read file {raw_path}. Skipping.")
            continue
        
        # Convert to PIL for MTCNN
        img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        boxes, _ = mtcnn.detect(img_pil)
        
        if boxes is not None:
            for box in boxes:
                x1, y1, x2, y2 = box
                w = x2 - x1
                h = y2 - y1
                # Filter out small faces
                if w < 80 or h < 100:
                    continue  # skip small face
                
                # Crop face
                face_crop = img_pil.crop((x1, y1, x2, y2))
                face_crop = face_crop.resize((160, 160))
                
                face_tensor = mtcnn(face_crop)
                if face_tensor is None:
                    continue
                
                if face_tensor.dim() == 3:
                    face_tensor = face_tensor.unsqueeze(0)
                face_tensor = face_tensor.to(device)
                
                with torch.no_grad():
                    embedding = resnet(face_tensor)
                
                # Compare
                identity, distance = compare_faces(embedding)
                
                # Log and save annotated face
                log_face(identity, distance)
                # Create an annotated face image just like your existing capture_face() logic
                annotated = annotate_face(frame, (x1, y1, x2, y2), identity, distance)
                # Save the annotated image
                save_annotated_face(annotated, identity, distance)
        
        # Move the raw file to FRedPic/ after processing
        new_path = os.path.join(FRED_PIC_DIR, fname)
        os.rename(raw_path, new_path)
        print(f"Moved {raw_path} -> {new_path}")

def compare_faces(embedding):
    """
    Compare with database_embeddings. Return (identity, distance).
    Same logic as your existing code.
    """
    min_distance = float("inf")
    identity = "Unknown"
    for name, db_embedding in database_embeddings.items():
        dist = torch.norm(embedding - db_embedding, p=2).item()
        if dist < min_distance:
            min_distance = dist
            identity = name if dist < 0.9 else "Unknown"
    return identity, min_distance

def log_face(identity, distance):
    timestamp = datetime.now().strftime("%m-%d-%Y %H:%M:%S")
    log_entry = f"{identity} ({distance:.2f}), {timestamp}\n"
    with open(LOG_FILE, "a") as f:
        f.write(log_entry)
    print(f"Logged: {log_entry.strip()}")

def annotate_face(frame, box, identity, distance):
    """
    Draw bounding box and text onto the frame. Return the annotated image (OpenCV format).
    """
    x1, y1, x2, y2 = [int(v) for v in box]
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
    cv2.putText(frame, f"{identity} ({distance:.2f})", (x1, y1-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
    return frame

def save_annotated_face(frame, identity, distance):
    """
    Save the entire annotated frame or just the face region. 
    Example: Save entire annotated frame in captured_photo/.
    """
    timestamp_str = datetime.now().strftime("%m%d%Y_%H%M%S")
    filename = f"{identity} ({distance:.2f})_{timestamp_str}.jpg"
    path = os.path.join(CAPTURED_PHOTO_DIR, filename)
    cv2.imwrite(path, frame)
    print(f"Saved recognized face to {path}")

##############################################
# Main Loop
##############################################

def main():
    global last_trigger_time
    print("Press 'c' to capture an image.")
    print("Press 'r' to run face recognition immediately on RawPic/.")
    print("Press 'q' to quit.")
    
    while True:
        # Check if 5 minutes have passed since last trigger
        if time.time() - last_trigger_time >= WAIT_TIME and last_trigger_time != 0:
            print("5 minutes passed since last trigger; running recognition now...")
            run_face_recognition_on_rawpics()
            # Reset last_trigger_time so it won't re-run repeatedly
            last_trigger_time = 0
        
        key = input("Enter command (c/r/q): ").strip().lower()
        if key == "c":
            # Capture
            capture_image()
            last_trigger_time = time.time()
        elif key == "r":
            # Immediate recognition
            run_face_recognition_on_rawpics()
            last_trigger_time = 0
        elif key == "q":
            print("Exiting.")
            break
        else:
            print("Unknown command.")

if __name__ == "__main__":
    main()
