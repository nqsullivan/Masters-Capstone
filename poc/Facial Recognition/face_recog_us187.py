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

##############################################
# Load precomputed embeddings
##############################################

EMBEDDINGS_FILE = "precomputed_data/embeddings.npy"
# Check if precomputed embeddings file exists, else generate
if not os.path.exists(EMBEDDINGS_FILE):
    print(f"Precomputed embeddings not found at '{EMBEDDINGS_FILE}'. Generating embeddings...")
    # Run the precompute_embeddings.py script to generate embeddings
    os.system("python precompute_embeddings.py")
database_embeddings = np.load(EMBEDDINGS_FILE, allow_pickle=True).item()
for name, emb in database_embeddings.items():
    emb_tensor = torch.tensor(emb, dtype=torch.float).to(device)
    if emb_tensor.dim() == 1:
        emb_tensor = emb_tensor.unsqueeze(0)
    database_embeddings[name] = emb_tensor

# Directories
RAW_PIC_DIR = "RawPic"
CAPTURED_PHOTO_DIR = "captured_photo"    # For cropped face images (170x240)
FRED_PIC_DIR = "FRedPic"                 # For full-frame annotated images
LOG_FILE = "face_log.txt"

for d in [RAW_PIC_DIR, CAPTURED_PHOTO_DIR, FRED_PIC_DIR]:
    if not os.path.exists(d):
        os.makedirs(d)

# WAIT_TIME (seconds)
WAIT_TIME = 10
last_trigger_time = 0.0

##############################################
# Utility Functions
##############################################

def capture_image(cap):
    """
    Capture one frame from the already opened camera (cap) and save it to RawPic/
    with filename 'mmddyyyy_hhmmss.jpg'. Returns the file path.
    """
    ret, frame = cap.read()
    if not ret:
        print("⚠️ Failed to read from camera.")
        return None

    timestamp_str = datetime.now().strftime("%m%d%Y_%H%M%S")
    filename = f"{timestamp_str}.jpg"
    filepath = os.path.join(RAW_PIC_DIR, filename)
    cv2.imwrite(filepath, frame)
    print(f"✅ Captured image: {filepath}")
    return filepath

def resize_with_padding(image, target_size=(170, 240)):
    """
    Resize the 'image' (NumPy array) to target_size while maintaining aspect ratio.
    Adds black padding if necessary.
    """
    h, w = image.shape[:2]
    target_w, target_h = target_size
    scale = min(target_w / w, target_h / h)
    new_w = int(w * scale)
    new_h = int(h * scale)

    # Resize
    resized_image = cv2.resize(image, (new_w, new_h))

    # Create black canvas
    padded_image = np.zeros((target_h, target_w, 3), dtype=np.uint8)

    x_offset = (target_w - new_w) // 2
    y_offset = (target_h - new_h) // 2
    padded_image[y_offset:y_offset+new_h, x_offset:x_offset+new_w] = resized_image

    return padded_image

def save_annotated_frame_in_fred(annotated_frame, identity, distance, captured_ts_str):
    """
    Save the entire annotated frame (bounding box, text) in FRedPic/.
    The file name includes the same timestamp from the raw image.
    """
    filename = f"{identity} ({distance:.2f})_{captured_ts_str}.jpg"
    path = os.path.join(FRED_PIC_DIR, filename)
    cv2.imwrite(path, annotated_frame)
    print(f"Saved annotated frame to {path}")

def save_cropped_face_in_captured(face_pil, identity, distance, captured_ts_str):
    """
    Save the cropped face (PIL Image) to captured_photo/, resized to 170x240 with padding.
    Also overlay identity, distance, and the same timestamp from the raw file.
    """
    # Convert PIL -> NumPy (BGR)
    face_np = cv2.cvtColor(np.array(face_pil), cv2.COLOR_RGB2BGR)

    # Resize with padding
    resized_face = resize_with_padding(face_np, target_size=(170, 240))

    # Overlay text
    cv2.putText(resized_face, f"{identity} ({distance:.2f})", (10, 20),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
    cv2.putText(resized_face, captured_ts_str, (10, 40),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)

    # Save with the same timestamp
    filename = f"{identity} ({distance:.2f})_{captured_ts_str}.jpg"
    path = os.path.join(CAPTURED_PHOTO_DIR, filename)
    cv2.imwrite(path, resized_face)
    print(f"Saved cropped face to {path}")

def run_face_recognition_on_rawpics():
    """
    Run face detection & recognition on all images in RawPic/.
    - Save entire annotated frame to FRedPic/ (with raw timestamp).
    - Save cropped face (170x240) to captured_photo/ (with raw timestamp).
    - Use the same timestamp in the log entry.
    - Delete the raw file from RawPic/.
    """
    for fname in os.listdir(RAW_PIC_DIR):
        if not fname.lower().endswith((".jpg", ".png")):
            continue

        raw_path = os.path.join(RAW_PIC_DIR, fname)
        frame = cv2.imread(raw_path)
        if frame is None:
            print(f"⚠️ Could not read file {raw_path}. Skipping.")
            continue

        # Extract the timestamp from the raw filename (e.g. "03192025_022058")
        captured_ts_str = os.path.splitext(fname)[0]  # remove ".jpg"

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

                # Crop face (PIL)
                face_crop_pil = img_pil.crop((x1, y1, x2, y2))
                # Optionally, resize to (160,160) before embedding
                face_crop_160 = face_crop_pil.resize((160, 160))

                # Preprocess face with MTCNN again (alignment)
                face_tensor = mtcnn(face_crop_160)
                if face_tensor is None:
                    continue

                if face_tensor.dim() == 3:
                    face_tensor = face_tensor.unsqueeze(0)
                face_tensor = face_tensor.to(device)

                # Compute embedding with InceptionResnetV1
                with torch.no_grad():
                    embedding = resnet(face_tensor)

                # Compare with registered embeddings
                identity, distance = compare_faces(embedding)

                # Log recognition with the same timestamp
                log_face(identity, distance, captured_ts_str)

                # 1) Annotate entire frame with bounding box & text
                annotated_frame = annotate_face(frame.copy(), (x1, y1, x2, y2), identity, distance)
                # Save to FRedPic (using the raw timestamp)
                save_annotated_frame_in_fred(annotated_frame, identity, distance, captured_ts_str)

                # 2) Save cropped face (170x240) to captured_photo (using the raw timestamp)
                save_cropped_face_in_captured(face_crop_pil, identity, distance, captured_ts_str)

        # Delete the raw file from RawPic
        os.remove(raw_path)
        print(f"Deleted raw file {raw_path}")

def compare_faces(embedding):
    """
    Compare a given face embedding with the embeddings of registered students.
    Returns the identity and distance to the closest match.
    """
    min_distance = float("inf")
    identity = "Unknown"
    for name, db_embedding in database_embeddings.items():
        dist = torch.norm(embedding - db_embedding, p=2).item()
        if dist < min_distance:
            min_distance = dist
            identity = name if dist < 0.9 else "Unknown"
    return identity, min_distance

def log_face(identity, distance, captured_ts_str):
    """
    Log an entry to face_log.txt using the same timestamp from the raw file.
    """
    # We can keep the same "mmddyyyy_hhmmss" format or parse it to something else
    # For simplicity, just log it as is
    log_entry = f"{identity} ({distance:.2f}), {captured_ts_str}\n"
    with open(LOG_FILE, "a") as f:
        f.write(log_entry)
    print(f"Logged: {log_entry.strip()}")

def annotate_face(frame, box, identity, distance):
    """
    Draw bounding box and text onto the frame. Return the annotated image.
    """
    x1, y1, x2, y2 = [int(v) for v in box]
    cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
    cv2.putText(frame, f"{identity} ({distance:.2f})", (x1, y1-10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
    return frame

##############################################
# Main Loop
##############################################

def main():
    global last_trigger_time

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("⚠️ Camera not opened.")
        return

    print("========================================================")
    print("   Press 'c' to capture an image.")
    print("   Press 'r' to run face recognition immediately on RawPic/.")
    print("   Press 'q' to quit.")
    print(f"   If {WAIT_TIME}s pass after your last capture, recognition runs automatically.")
    print("========================================================")

    while True:
        # 1) Check the timer for auto recognition
        if time.time() - last_trigger_time >= WAIT_TIME and last_trigger_time != 0:
            print(f"{WAIT_TIME} seconds passed; running recognition now...")
            run_face_recognition_on_rawpics()
            last_trigger_time = 0

        # 2) Display a live feed from the camera so we have an OpenCV window
        ret, frame = cap.read()
        if not ret:
            print("⚠️ Camera read failed.")
            break

        # Show the camera feed in a window (must keep this window in focus for keystrokes!)
        cv2.imshow("Press c/r/q in this window", frame)

        # 3) Check for key press in the OpenCV window
        key_code = cv2.waitKey(1) & 0xFF

        if key_code == ord('c'):
            # Capture one frame to RawPic/
            capture_image(cap)
            last_trigger_time = time.time()

        elif key_code == ord('r'):
            # Manually run face recognition
            run_face_recognition_on_rawpics()
            last_trigger_time = 0

        elif key_code == ord('q'):
            print("Exiting.")
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
