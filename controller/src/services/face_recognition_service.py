import os
import cv2
import torch
import numpy as np
from PIL import Image
from datetime import datetime
from facenet_pytorch import InceptionResnetV1, MTCNN

from src.services.logging_service import printt


class FaceRecognitionService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(FaceRecognitionService, cls).__new__(cls)
            cls._instance._initialize()
        return cls._instance

    def _initialize(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.mtcnn = MTCNN(keep_all=True, device=self.device)
        self.resnet = InceptionResnetV1(pretrained="vggface2").eval().to(self.device)

        root_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../data")
        )
        self.EMBEDDINGS_FILE = os.path.join(
            root_dir, "precomputed_data", "embeddings.npy"
        )
        self.RAW_PIC_DIR = os.path.join(root_dir, "RawPic")
        self.CAPTURED_PHOTO_DIR = os.path.join(root_dir, "captured_photo")
        self.FRED_PIC_DIR = os.path.join(root_dir, "FRedPic")
        self.LOG_FILE = os.path.join(root_dir, "face_log.txt")

        for d in [self.RAW_PIC_DIR, self.CAPTURED_PHOTO_DIR, self.FRED_PIC_DIR]:
            os.makedirs(d, exist_ok=True)

        if not os.path.exists(self.EMBEDDINGS_FILE):
            self._precompute_embeddings()

        self.database_embeddings = self._load_or_generate_embeddings()

    def _load_or_generate_embeddings(self):
        if not os.path.exists(self.EMBEDDINGS_FILE):
            printt(f"Embeddings not found. Generating new embeddings...")
            self._precompute_embeddings()
        return self._load_embeddings()

    def _load_embeddings(self):
        embeddings = np.load(self.EMBEDDINGS_FILE, allow_pickle=True).item()
        for name, emb in embeddings.items():
            emb_tensor = torch.tensor(emb, dtype=torch.float).to(self.device)
            if emb_tensor.dim() == 1:
                emb_tensor = emb_tensor.unsqueeze(0)
            embeddings[name] = emb_tensor
        return embeddings

    def _precompute_embeddings(self):
        root_dir = os.path.abspath(
            os.path.join(os.path.dirname(__file__), "../../data")
        )
        student_faces = {
            "Zhiguo Ren": os.path.join(root_dir, "registered_photos", "Zhiguo Ren.jpg"),
            "Alvin Tran": os.path.join(root_dir, "registered_photos", "Alvin Tran.jpg"),
            "Boan Li": os.path.join(root_dir, "registered_photos", "Boan Li.jpg"),
            "E2EEC801": os.path.join(
                root_dir, "registered_photos", "Nathaniel Sullivan.jpg"
            ),
            "Chen Chu": os.path.join(root_dir, "registered_photos", "Chen Chu.jpg"),
        }

        database_embeddings = {}

        for name, img_path in student_faces.items():
            if not os.path.exists(img_path):
                printt(f"Image not found: {img_path}")
                continue

            img = Image.open(img_path).convert("RGB")
            face_cropped = self.mtcnn(img)
            if face_cropped is None:
                printt(f"No face detected in image: {img_path}")
                continue

            if face_cropped.dim() == 3:
                face_cropped = face_cropped.unsqueeze(0)

            face_cropped = face_cropped.to(self.device)

            with torch.no_grad():
                embedding = self.resnet(face_cropped)

            embedding = embedding.squeeze(0).cpu().numpy()
            database_embeddings[name] = embedding

        os.makedirs(os.path.dirname(self.EMBEDDINGS_FILE), exist_ok=True)
        np.save(self.EMBEDDINGS_FILE, database_embeddings)

    def run_on_image(self, image_path: str):
        frame = cv2.imread(image_path)
        if frame is None:
            raise ValueError(f"Could not read image at {image_path}")

        timestamp = os.path.splitext(os.path.basename(image_path))[0]
        img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
        boxes, _ = self.mtcnn.detect(img_pil)

        results = []

        if boxes is not None:
            for box in boxes:
                x1, y1, x2, y2 = box
                w, h = x2 - x1, y2 - y1
                if w < 80 or h < 100:
                    continue

                face_crop_pil = img_pil.crop((x1, y1, x2, y2)).resize((160, 160))
                face_tensor = self.mtcnn(face_crop_pil)

                if face_tensor is None:
                    continue

                if face_tensor.dim() == 3:
                    face_tensor = face_tensor.unsqueeze(0)

                face_tensor = face_tensor.to(self.device)

                with torch.no_grad():
                    embedding = self.resnet(face_tensor)

                identity, distance = self._compare(embedding)

                printt(f"Identified Photo as {identity}")

                annotated = self._annotate_frame(frame.copy(), box, identity, distance)
                annotated_path = self._save_annotated_frame(
                    annotated, identity, distance, timestamp
                )
                cropped_path = self._save_cropped_face(
                    face_crop_pil, identity, distance, timestamp
                )

                self._log(identity, distance, timestamp)

                results.append(
                    {
                        "identity": identity,
                        "distance": distance,
                        "annotatedPath": annotated_path,
                        "croppedPath": cropped_path,
                    }
                )

        os.remove(image_path)
        return results

    def _compare(self, embedding):
        min_dist = float("inf")
        identity = "Unknown"
        for name, db_emb in self.database_embeddings.items():
            dist = torch.norm(embedding - db_emb, p=2).item()
            if dist < min_dist:
                min_dist = dist
                identity = name if dist < 0.9 else "Unknown"
        return identity, min_dist

    def _annotate_frame(self, frame, box, identity, distance):
        x1, y1, x2, y2 = [int(v) for v in box]
        cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
        cv2.putText(
            frame,
            f"{identity} ({distance:.2f})",
            (x1, y1 - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            2,
        )
        return frame

    def _save_annotated_frame(self, frame, identity, distance, ts):
        path = os.path.join(self.FRED_PIC_DIR, f"{identity} ({distance:.2f})_{ts}.jpg")
        cv2.imwrite(path, frame)
        return path

    def _save_cropped_face(self, face_pil, identity, distance, ts):
        face_np = cv2.cvtColor(np.array(face_pil), cv2.COLOR_RGB2BGR)
        resized = self._resize_with_padding(face_np)
        cv2.putText(
            resized,
            f"{identity} ({distance:.2f})",
            (10, 20),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 255, 0),
            2,
        )
        cv2.putText(
            resized, ts, (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2
        )
        path = os.path.join(
            self.CAPTURED_PHOTO_DIR, f"{identity} ({distance:.2f})_{ts}.jpg"
        )
        cv2.imwrite(path, resized)
        return path

    def _resize_with_padding(self, image, target_size=(170, 240)):
        h, w = image.shape[:2]
        target_w, target_h = target_size
        scale = min(target_w / w, target_h / h)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(image, (new_w, new_h))
        padded = np.zeros((target_h, target_w, 3), dtype=np.uint8)
        x_off, y_off = (target_w - new_w) // 2, (target_h - new_h) // 2
        padded[y_off : y_off + new_h, x_off : x_off + new_w] = resized
        return padded

    def _log(self, identity, distance, ts):
        entry = f"{identity} ({distance:.2f}), {ts}\n"
        with open(self.LOG_FILE, "a") as f:
            f.write(entry)
