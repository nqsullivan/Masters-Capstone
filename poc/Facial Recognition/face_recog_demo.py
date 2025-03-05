import cv2
import torch
import time
import os
from datetime import datetime
from facenet_pytorch import InceptionResnetV1, MTCNN
from PIL import Image
import numpy as np

# Initialize Face Detector (MTCNN) and Face Recognition Model (FaceNet)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
mtcnn = MTCNN(keep_all=True, device=device)  # Detect faces
resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)  # Face recognition model

# Load Registered Faces from Database (Simulation)
student_faces = {
    "Zhiguo Ren": "registered_photo/Zhiguo Ren.jpg",
    "Alvin Tran": "registered_photo/Alvin Tran.jpg",
    "Boan Li": "registered_photo/Boan Li.jpg",
    "Nathaniel Sullivan": "registered_photo/Nathaniel Sullivan.jpg",
    "Chen Chu": "registered_photo/Chen Chu.jpg",
}

database_embeddings = {}  # Dictionary to store face embeddings of registered students
seen_faces = {}  # Dictionary to track seen faces in the current session
SESSION_DURATION = 300  # Time in seconds (5 minutes session), session period can be modified as per real-world needs
LOG_FILE = "face_log.txt"  # File to log recognized faces
CAPTURED_PHOTO_DIR = "captured_photo"  # Directory to save captured face images

if not os.path.exists(CAPTURED_PHOTO_DIR):
    os.makedirs(CAPTURED_PHOTO_DIR)


def register_students():
    """
    Register students by loading their face images, detecting faces, and generating embeddings,for later comparison.
    """
    global database_embeddings
    for name, img_path in student_faces.items():
        if os.path.exists(img_path):
            img = Image.open(img_path).convert("RGB")
            img_cropped = mtcnn(img)  # Detect and align face
            if img_cropped is not None:
                # Ensure the tensor has the correct shape [batch_size, 3, height, width]
                if img_cropped.dim() == 3:
                    img_cropped = img_cropped.unsqueeze(0)  # Add batch dimension
                img_cropped = img_cropped.to(device)
                with torch.no_grad():
                    embedding = resnet(img_cropped)
                    if not torch.isnan(embedding).any() and not torch.isinf(embedding).any():
                        database_embeddings[name] = embedding
                    else:
                        print(f"⚠️ Warning: Invalid embedding detected for {name}. Skipping.")
    print("Student faces registered.")


register_students()  # Load face embeddings for registered students


def compare_faces(embedding):
    """
    Compare a given face embedding with the embeddings of registered students.
    Returns the identity of the closest match and the distance to that match.
    If no match is found, returns "Unknown".
    """
    min_distance = float("inf")
    identity = "Unknown"
    for name, db_embedding in database_embeddings.items():
        if torch.isnan(db_embedding).any() or torch.isinf(db_embedding).any():
            print(f"⚠️ Warning: Invalid database embedding for {name}, skipping.")
            continue
        distance = torch.norm(embedding - db_embedding, p=2).item()
        #print(f"Comparing with {name}, Distance: {distance:.4f}") # Comment out, displaying the real-time comparing
        if distance < min_distance:
            min_distance = distance
            identity = name if distance < 0.9 else "Unknown"  # Adjusted threshold

    if np.isinf(min_distance) or np.isnan(min_distance):
        print("⚠️ Warning: Distance calculation resulted in inf or NaN, resetting to default.")
        min_distance = 999.0  # Set a high distance to indicate failure

    return identity, min_distance


def log_face(identity):
    """
    Log the recognized face identity along with a timestamp to the log file.
    """
    try:
        timestamp = datetime.now().strftime("%m-%d-%Y %H:%M:%S")
        log_entry = f"{identity}, {timestamp}\n"
        with open(LOG_FILE, "a") as log_file:
            log_file.write(log_entry)
        print(f"Logged: {log_entry.strip()}")
    except Exception as e:
        print(f"⚠️ Error logging face: {e}")


def resize_with_padding(image, target_size=(170, 240)):
    """
    Resize the image to the target size while maintaining the aspect ratio.
    Add padding (black borders) if necessary to avoid distortion.
    """
    h, w = image.shape[:2]
    target_w, target_h = target_size

    # Calculate the scaling factor and new dimensions
    scale = min(target_w / w, target_h / h)
    new_w = int(w * scale)
    new_h = int(h * scale)

    # Resize the image
    resized_image = cv2.resize(image, (new_w, new_h))

    # Create a blank canvas with the target size
    padded_image = np.zeros((target_h, target_w, 3), dtype=np.uint8)

    # Calculate padding offsets
    x_offset = (target_w - new_w) // 2
    y_offset = (target_h - new_h) // 2

    # Place the resized image in the center of the canvas
    padded_image[y_offset:y_offset + new_h, x_offset:x_offset + new_w] = resized_image

    return padded_image


def capture_face(identity, frame, x, y, w, h):
    """
    Capture and save the detected face image with a timestamp and identity label.
    The image is resized to a fixed dimension (170x240) before saving.
    """
    try:
        timestamp = datetime.now().strftime("%m%d%Y_%H%M%S")
        filename = os.path.join(CAPTURED_PHOTO_DIR, f"{identity}_{timestamp}.jpg")
        face_crop = frame[int(y):int(h), int(x):int(w)]

        # Resize the face image to a fixed dimension (170x240) with padding
        resized_face = resize_with_padding(face_crop, target_size=(170, 240))  # Added resizing logic

        # Add text to the resized image
        cv2.putText(resized_face, f"{identity}, {timestamp}", (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        # Save the resized image
        cv2.imwrite(filename, resized_face)
        print(f"Captured {filename}")
    except Exception as e:
        print(f"⚠️ Error capturing face: {e}")


def reset_session():
    """
    Reset the session by removing faces that haven't been seen within the session duration.
    This ensures that only recent faces are tracked in the `seen_faces` dictionary.
    """
    global seen_faces
    current_time = time.time()
    seen_faces = {k: v for k, v in seen_faces.items() if current_time - v < SESSION_DURATION}


def main():
    """
    Main function to run the face recognition system.
    Captures video from the camera, detects faces, recognizes them, and logs/captures the results.
    """
    cap = cv2.VideoCapture(0)
    while not cap.isOpened():
        print("⚠️ Camera is not opened, retrying...")
        cap = cv2.VideoCapture(0)
    print("Press 'q' to quit camera")

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        boxes, _ = mtcnn.detect(img_pil)  # Detect faces and get bounding boxes

        if boxes is not None:
            for i, box in enumerate(boxes):
                x, y, w, h = box
                face_crop = img_pil.crop((x, y, w, h))  # Crop the face
                face_crop = face_crop.resize((160, 160))  # Resize to match FaceNet input size
                face_tensor = mtcnn(face_crop)  # Preprocess the face

                if face_tensor is not None:
                    # Ensure the tensor has the correct shape [batch_size, 3, height, width]
                    if face_tensor.dim() == 3:
                        face_tensor = face_tensor.unsqueeze(0)  # Add batch dimension
                    face_tensor = face_tensor.to(device)
                    with torch.no_grad():
                        embedding = resnet(face_tensor)
                        if torch.isnan(embedding).any() or torch.isinf(embedding).any():
                            print("⚠️ Warning: Invalid face embedding detected, skipping recognition.")
                            continue

                        identity, distance = compare_faces(embedding)

                    if identity not in seen_faces or time.time() - seen_faces[identity] > SESSION_DURATION:
                        seen_faces[identity] = time.time()
                        capture_face(identity, frame, x, y, w, h)
                        log_face(identity)

                    cv2.rectangle(frame, (int(x), int(y)), (int(w), int(h)), (0, 255, 0), 2)
                    cv2.putText(frame, f"{identity} ({distance:.2f})", (int(x), int(y - 10)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        reset_session()
        cv2.imshow("Face Recognition", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()