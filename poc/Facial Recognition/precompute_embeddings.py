"""
Precomputes 512-d face embeddings for pre-registered student images.
Images that do not exist or where no face is detected are skipped.
Embeddings are saved as 'embeddings.npy' in the 'precomputed_data' directory,
so that real-time recognition can load them without re-computation on each run,
saving real-time computing resources.
Run this script manually when new student images are added.
"""

import os
import numpy as np
from PIL import Image
import torch
from facenet_pytorch import MTCNN, InceptionResnetV1

# 1. Initialize the same MTCNN and ResNet
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
mtcnn = MTCNN(keep_all=False, device=device)
resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)

# 2. Dictionary of registered student photos (same as in face_recog_demo.py)
student_faces = {
    "Zhiguo Ren": "registered_photo/Zhiguo Ren.jpg",
    "Alvin Tran": "registered_photo/Alvin Tran.jpg",
    "Boan Li": "registered_photo/Boan Li.jpg",
    "Nathaniel Sullivan": "registered_photo/Nathaniel Sullivan.jpg",
    "Chen Chu": "registered_photo/Chen Chu.jpg",
}

def precompute_embeddings():
    """
    Precompute 512-d face embeddings using the same pipeline
    as in face_recog_demo.py. Save them in 'precomputed_data/embeddings.npy'.
    """
    database_embeddings = {}

    for name, img_path in student_faces.items():
        if not os.path.exists(img_path):
            print(f"⚠️ Warning: Image not found at path {img_path}. Skipping {name}.")
            continue
        
        # Load and convert to RGB
        img = Image.open(img_path).convert("RGB")

        # Use MTCNN to detect and align the face
        face_cropped = mtcnn(img)
        if face_cropped is None:
            print(f"⚠️ Warning: No face detected or alignment failed for {name}. Skipping.")
            continue

        # If MTCNN returns [3, 160, 160], add a batch dimension => [1, 3, 160, 160]
        if face_cropped.dim() == 3:
            face_cropped = face_cropped.unsqueeze(0)

        face_cropped = face_cropped.to(device)

        # Generate the 512-d embedding with InceptionResnetV1
        with torch.no_grad():
            embedding = resnet(face_cropped)  # shape [1, 512]
        
        # Move embedding to CPU for saving
        embedding = embedding.squeeze(0).cpu().numpy()  # shape [512]
        database_embeddings[name] = embedding
        print(f"✅ Successfully computed 512-d embedding for {name}.")

    # Ensure the precomputed_data folder exists
    precomputed_data_folder = "precomputed_data"
    if not os.path.exists(precomputed_data_folder):
        os.makedirs(precomputed_data_folder)

    # Save the embeddings to a file in the precomputed_data folder
    np.save(os.path.join(precomputed_data_folder, "embeddings.npy"), database_embeddings)
    print(f"✅ 512-d face embeddings saved to {precomputed_data_folder}/embeddings.npy")

if __name__ == "__main__":
    precompute_embeddings()
