import cv2
import torch
#import numpy as np
from facenet_pytorch import InceptionResnetV1, MTCNN
from PIL import Image
import os

# Initialize Face Detector (MTCNN) and Face Recognition Model (FaceNet)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
mtcnn = MTCNN(keep_all=True, device=device)  # Detect faces
resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)  # Face recognition model

# Load Registered Faces from Database (Simulation)
student_faces = {
    "Zhiguo Ren": "registered_photo/Zhiguo Ren.jpg",
    "Alvin Tran": "registered_photo/Alvin Tran.jpg",
    "Boan Li":"registered_photo/Boan Li.jpg",
    "Nathaniel Sullivan" :"Nathaniel Sullivan.jpg",
    "Chen Chu":"Chen Chu.jpg",
}

database_embeddings = {}

# Function to Precompute Face Embeddings for Students

def register_students():
    global database_embeddings
    for name, img_path in student_faces.items():
        if os.path.exists(img_path):
            img = Image.open(img_path)

            # Ensure image is in RGB format (Fix for RGBA issue)
            if img.mode != "RGB":
                img = img.convert("RGB")

            img_cropped = mtcnn(img)
            if img_cropped is not None:
                if img_cropped.dim() == 4:  # If batch dimension exists, remove it
                    img_cropped = img_cropped.squeeze(0)  # Convert from [1, 3, 160, 160] to [3, 160, 160]

                with torch.no_grad():
                    embedding = resnet(img_cropped.unsqueeze(0).to(device))  # Ensure correct shape
                    database_embeddings[name] = embedding

    print("Student faces registered.")

register_students()  # Load face embeddings for registered students


# Function to Calculate Similarity
def compare_faces(embedding):
    min_distance = float("inf")
    identity = "Unknown"

    for name, db_embedding in database_embeddings.items():
        distance = torch.norm(embedding - db_embedding, p=2).item()  # Euclidean Distance
        if distance < min_distance:
            min_distance = distance
            identity = name if distance < 0.9 else "Unknown"  # Threshold 0.9

    return identity, min_distance


# Open Laptop Camera
cap = cv2.VideoCapture(0)

while not cap.isOpened():  # Ensure camera opens properly
    print("⚠️ Camera is not opened, retrying...")
    cap = cv2.VideoCapture(0)  # Retry opening the camera

print("Press 'q' to quit camera")

while True:
    ret, frame = cap.read()
    if not ret:
        print("❌ Unable to read frames from the camera, it may be disconnected or disabled")
        break

    # Convert frame to PIL Image
    img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

    # Detect Faces

    faces_cropped = mtcnn(img_pil)

    if faces_cropped is not None:
        for i, face in enumerate(faces_cropped):
            if face.dim() == 4:  # Remove extra batch dimension if exists
                face = face.squeeze(0)

            with torch.no_grad():
                embedding = resnet(face.unsqueeze(0).to(device))
                identity, distance = compare_faces(embedding)

            # Draw Bounding Box & Label
            x, y, w, h = mtcnn.detect(img_pil)[0][i]
            cv2.rectangle(frame, (int(x), int(y)), (int(w), int(h)), (0, 255, 0), 2)
            cv2.putText(frame, f"{identity} ({distance:.2f})", (int(x), int(y - 10)),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    # Display Video Feed
    cv2.imshow("Face Recognition", frame)

    # Exit on 'q' key press
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
