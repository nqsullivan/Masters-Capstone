"""
Add us255_Async FR from clipped video functionality
based on file face_recog_ts250.py
    -#250 clip video when triggered event happens
    -#195 Take a picture
    -#196 Run facial recognition on the picture)
"""

import cv2
import os
import time
import numpy as np
from datetime import datetime
import torch
from PIL import Image
from facenet_pytorch import InceptionResnetV1, MTCNN
import threading  # Import threading for asynchronous clip recording

##############################################
# Initialization
##############################################

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
mtcnn = MTCNN(keep_all=True, device=device)
resnet = InceptionResnetV1(pretrained="vggface2").eval().to(device)

# Add a global lock to synchronize video file renaming
video_rename_lock = threading.Lock()  

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
CLIP_VIDEO_DIR = "ClipVideo"             # For storage of the clipped videos
CLIP_VIDEO_V_DIR = "ClipVideo_V"         # For storage of clipped videos after FR processing
FRED_PIC_V_DIR = "FRedPic_V"             # For full-frame annotated images from video FR
CAPTURED_PHOTO_V_DIR = "captured_photo_V"   # For cropped face images from video FR

for d in [RAW_PIC_DIR, CAPTURED_PHOTO_DIR, FRED_PIC_DIR, CLIP_VIDEO_DIR, CLIP_VIDEO_V_DIR, FRED_PIC_V_DIR, CAPTURED_PHOTO_V_DIR]: 
    if not os.path.exists(d):
        os.makedirs(d)

# # WAIT_TIME for image recognition and new WAIT_TIME_V for video recognition
WAIT_TIME = 10      # seconds for auto FR on captured image 
WAIT_TIME_V = 20    # seconds for auto FR on clipped video
last_trigger_time = 0.0
last_trigger_time_v = 0.0

# Variables for video clip recording
fps = 20                     # Frames per second for video recording
max_buffer = fps * 10        # Buffer holds last 10 seconds of frames
frame_buffer = []            # Circular buffer for recent frames

# modify: Create a lock to protect cap.read() operations across threads
cap_lock = threading.Lock()

##############################################
# Utility Functions
##############################################

def capture_image(cap):
    """
    Capture one frame from the already opened camera (cap) and save it to RawPic/
    with filename 'mmddyyyy_hhmmss.jpg'. Returns the file path.
    """
    with cap_lock:  # modify: lock for safe reading
        ret, frame = cap.read()
    if not ret:
        print("⚠️ Failed to read from camera.")
        return None, None

    timestamp_str = datetime.now().strftime("%m%d%Y_%H%M%S_%f")[:-3]  # set Higher Resolution Timestamp
    filename = f"{timestamp_str}.jpg"
    filepath = os.path.join(RAW_PIC_DIR, filename)
    cv2.imwrite(filepath, frame)
    print(f"📸 Captured image: {filepath}")
    # return filepath
    return filepath, timestamp_str  # <-- return timestamp too

def record_clip(cap, trigger_ts=None):
    """
    Record a 15-second video clip for a trigger event.
    The clip covers 10 seconds before and 5 seconds after the trigger.
    Saves the clip in the 'ClipVideo' folder with the trigger timestamp as the filename.
    """
    global frame_buffer, fps, max_buffer

    # trigger_ts = datetime.now().strftime("%m%d%Y_%H%M%S_%f")[:-3]  # set Higher Resolution Timestamp
    # print(f"Trigger event for video clip at {trigger_ts}")
    if trigger_ts is None:
        trigger_ts = datetime.now().strftime("%m%d%Y_%H%M%S_%f")[:-3]
    print(f"🎬 Trigger event for video clip at {trigger_ts}")

    # 1) Retrieve buffered frames (last 10 sec)
    with threading.Lock():  # modify: ensure safe copying from frame_buffer
        clip_frames = list(frame_buffer)

    # 2) Record additional frames for 5 seconds in a separate thread
    additional_frames = []
    start_time = time.time()
    while time.time() - start_time < 5:
        with cap_lock:  # modify: lock around cap.read()
            ret, frame = cap.read()
        if not ret:
            continue
        additional_frames.append(frame)
        # Update the frame buffer safely
        with threading.Lock(): # modify: lock for safe writing to frame_buffer
            frame_buffer.append(frame)
            if len(frame_buffer) > max_buffer:
                frame_buffer.pop(0)

        # cv2.imshow("Press c/r/q in this window", frame)   # commented out to Prevent OpenCV C++ crash from thread GUI access
        # cv2.waitKey(1)  # commented out to Prevent OpenCV C++ crash from thread GUI access

    # Combine frames
    clip_frames.extend(additional_frames)

    # 3) Save the clip to "ClipVideo"
    filepath = os.path.join(CLIP_VIDEO_DIR, f"{trigger_ts}.mp4")
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    height, width = clip_frames[0].shape[:2]
    out = cv2.VideoWriter(filepath, fourcc, fps, (width, height))
    for f in clip_frames:
        out.write(f)
    out.release()
    print(f"✅ Saved video clip to {filepath}")

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
    print(f"🖼️  Saved annotated frame to {path}")

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
    print(f"🙂 Saved cropped face to {path}")

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

        # Initialize variables to hold FR result (assumes one major face per image)
        fr_identity = None
        fr_distance = None

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
                fr_identity = identity
                fr_distance = distance

                # Log recognition with the same timestamp
                log_face(identity, distance, captured_ts_str)

                # 1) Annotate entire frame with bounding box & text
                annotated_frame = annotate_face(frame.copy(), (x1, y1, x2, y2), identity, distance)
                # Save to FRedPic (using the raw timestamp)
                save_annotated_frame_in_fred(annotated_frame, identity, distance, captured_ts_str)

                # 2) Save cropped face (170x240) to captured_photo (using the raw timestamp)
                save_cropped_face_in_captured(face_crop_pil, identity, distance, captured_ts_str)

         # --- NEW CODE BLOCK START ---
        # Rename the corresponding video clip (if it exists)
        if fr_identity is not None and fr_distance is not None:
            orig_video = os.path.join(CLIP_VIDEO_DIR, f"{captured_ts_str}.mp4")
            if os.path.exists(orig_video):
                new_video = os.path.join(CLIP_VIDEO_DIR, f"{fr_identity} ({fr_distance:.2f})_{captured_ts_str}.mp4")
                try:
                    with video_rename_lock:
                        os.rename(orig_video, new_video)
                    print(f"🔀 Renamed video clip from {orig_video} to {new_video}")
                except PermissionError as e:
                    print(f"⚠️ Unable to rename video {orig_video} due to: {e}")
                
        # --- NEW CODE BLOCK END ---
        
        # Delete the raw file from RawPic
        os.remove(raw_path)
        print(f"🗑️  Deleted raw file {raw_path}")

def run_face_recognition_on_videos():
    """
    Process each clipped video in CLIP_VIDEO folder and create an output video in CLIP_VIDEO_V
    with continuous overlays based on 5 evenly spaced sample frames.
    Additionally, from the 5 sample frames, select the "best" sample according to:
      - If one or more samples have an identity matching the one in the video filename,
        select the sample with the smallest (best) similarity distance among those.
      - Otherwise, select the sample with the overall smallest similarity distance.
    Then save:
      - The full annotated frame (with bounding box and label) as a picture in FRedPic_V.
      - The cropped face from that frame in captured_photo_V.
    We use "VV" for "Video Verified" and "VF" for "Varify Failed" to represent the FR sesults on video.
    """
    video_files = [f for f in os.listdir(CLIP_VIDEO_DIR) if f.lower().endswith(".mp4")]

    for vf in video_files:
        # Skip if already processed (contains " VV" or " VF")
        if " VV" in vf or " VF" in vf:
            continue

        video_path = os.path.join(CLIP_VIDEO_DIR, vf)
        base_name = os.path.splitext(vf)[0]

        # Extract the trigger timestamp from the video filename.
        # If the file was renamed to include identity info (e.g. "Zhiguo Ren (0.50)_04142025_165346_888"),
        # we extract the timestamp part after the pattern ")_".

        if ")_" in base_name:
            trigger_timestamp = base_name.split(")_")[-1]
        else:
            trigger_timestamp = base_name

        try:
            # Extract identity from video filename using " (" as delimiter.
            # For example, from "Zhiguo Ren (0.51)_04122025_231228_767" the identity is "Zhiguo Ren".
            identity_from_filename = base_name.split(" (")[0]
        except Exception as e:
            print(f"⚠️ Cannot parse video filename {vf}: {e}")
            continue

        # Open the video once to determine its properties and duration.
        cap_video = cv2.VideoCapture(video_path)
        if not cap_video.isOpened():
            print(f"⚠️ Cannot open video {video_path}")
            continue
        frame_rate = cap_video.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap_video.get(cv2.CAP_PROP_FRAME_COUNT))
        video_duration_sec = total_frames / frame_rate if frame_rate > 0 else 0
        width  = int(cap_video.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap_video.get(cv2.CAP_PROP_FRAME_HEIGHT))
        cap_video.release()
        if video_duration_sec <= 0:
            print(f"⚠️ Zero-length or invalid video: {video_path}")
            continue

        # Set sample fractions to [0.1, 0.3, 0.5, 0.7, 0.9]
        fractions = [0.1, 0.3, 0.5, 0.7, 0.9]
        sample_times_sec = [frac * video_duration_sec for frac in fractions]

        # For each sample time, seek and read that frame, then run FR.
        samples = []  # list of dictionaries holding sample results
        cap_video = cv2.VideoCapture(video_path)
        for t in sample_times_sec:
            # Ensure we get a valid frame even near the end.
            t = min(t, video_duration_sec - 0.001)
            cap_video.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ret, frame = cap_video.read()
            if not ret:
                samples.append(None)
                continue

            img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
            boxes, _ = mtcnn.detect(img_pil)
            sample_result = None
            if boxes is not None:
                for box in boxes:
                    x1, y1, x2, y2 = box
                    if (x2 - x1) < 80 or (y2 - y1) < 100:
                        continue
                    face_crop_pil = img_pil.crop((x1, y1, x2, y2))
                    face_crop_160 = face_crop_pil.resize((160, 160))
                    face_tensor = mtcnn(face_crop_160)
                    if face_tensor is None:
                        continue
                    if face_tensor.dim() == 3:
                        face_tensor = face_tensor.unsqueeze(0)
                    face_tensor = face_tensor.to(device)
                    with torch.no_grad():
                        embedding = resnet(face_tensor)
                    identity, dist = compare_faces(embedding)
                    sample_result = {
                        "time_sec": t,
                        "frame": frame,   # store the original frame
                        "box": (int(x1), int(y1), int(x2), int(y2)),
                        "identity": identity,
                        "distance": dist
                    }
                    break  # use the first valid face result
            samples.append(sample_result)
        cap_video.release()

        # Now, select the best sample based on the following rule:
        # If one or more sample result has its "identity" matching identity_from_filename,
        # choose the one among these with the lowest "distance"; otherwise choose the sample with overall lowest distance.
        best_sample = None
        matching_samples = [s for s in samples if s and s["identity"] == identity_from_filename]
        if matching_samples:
            best_sample = min(matching_samples, key=lambda s: s["distance"])
        else:
            valid_samples = [s for s in samples if s is not None]
            if valid_samples:
                best_sample = min(valid_samples, key=lambda s: s["distance"])

        # If a best sample was found, save its annotated full frame and cropped face.
        if best_sample is not None:
            # Annotate the frame with bounding box and label
            annotated_frame = annotate_face(best_sample["frame"].copy(), best_sample["box"],
                                            best_sample["identity"], best_sample["distance"])
            
            # Save annotated frame to FRedPic_V using the trigger timestamp instead of current time.
            filename_annotated = f"{best_sample['identity']} ({best_sample['distance']:.2f})_{trigger_timestamp} V.jpg"
            path_annotated = os.path.join(FRED_PIC_V_DIR, filename_annotated)
            cv2.imwrite(path_annotated, annotated_frame)
            print(f"🖼️  Saved annotated video FR frame to {path_annotated}")

            # Save cropped face: Crop the face using the stored bounding box and save to captured_photo_V.
            face_crop = best_sample["frame"][best_sample["box"][1]:best_sample["box"][3],
                                               best_sample["box"][0]:best_sample["box"][2]]
            if face_crop.size != 0:
                # Optionally, resize with padding as before.
                face_crop_padded = resize_with_padding(face_crop, target_size=(170,240))
                # Overlay identity/distance text
                cv2.putText(face_crop_padded, f"{best_sample['identity']} ({best_sample['distance']:.2f})",
                            (10, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
                # Overlay timestamp text
                cv2.putText(face_crop_padded, trigger_timestamp,
                            (10, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)
                # Draw bounding box around the entire cropped image
                # cv2.rectangle(face_crop_padded, (0, 0), (face_crop_padded.shape[1]-1, face_crop_padded.shape[0]-1),
                #               (0,255,0), 2)
                filename_cropped = f"{best_sample['identity']} ({best_sample['distance']:.2f})_{trigger_timestamp} V.jpg"
                path_cropped = os.path.join(CAPTURED_PHOTO_V_DIR, filename_cropped)
                cv2.imwrite(path_cropped, face_crop_padded)
                print(f"🙂 Saved cropped face from video FR frame to {path_cropped}")
            else:
                print("⚠️ Cropped face is empty; not saving captured_photo_V.")

        else:
            print(f"⚠️ No valid sample frame found for video {video_path}")

        # --- New log update: append suffix to log line for this timestamp ---
        # suffix = " VV" if match_count >= 3 else " VF"  # "VV" for "Video Verified" and "VF" for "Varify Failed"
        # update_video_log(trigger_timestamp, suffix)
        
        # Then, continue with existing processing: 
        # Count matches over continuous processing for video overlay (unchanged below)
        # (Original code for continuous overlay and video renaming remains as is.)
        
        # --- ORIGINAL CONTINUED: Process video to output with continuous overlay ---
        # (This code below is unchanged; it processes the video to add continuous overlays.)
        cap_video = cv2.VideoCapture(video_path)
        out_video_temp = os.path.join(CLIP_VIDEO_V_DIR, vf)  # temporary name
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out_writer = cv2.VideoWriter(out_video_temp, fourcc, frame_rate, (width, height))

        if frame_rate <= 0:
            frame_interval = 1
        else:
            frame_interval = int(frame_rate)

        match_count = 0
        total_frames = 0
        last_box = None
        last_identity = None
        last_distance = None

        while True:
            ret, frame = cap_video.read()
            if not ret:
                break
            total_frames += 1

            do_fr_this_frame = (match_count < 3) and (total_frames % frame_interval == 0)
            if do_fr_this_frame:
                img_pil = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
                boxes, _ = mtcnn.detect(img_pil)
                found_match = False
                if boxes is not None:
                    for box in boxes:
                        x1, y1, x2, y2 = box
                        if (x2 - x1) < 80 or (y2 - y1) < 100:
                            continue
                        face_crop_pil = img_pil.crop((x1, y1, x2, y2))
                        face_crop_160 = face_crop_pil.resize((160, 160))
                        face_tensor = mtcnn(face_crop_160)
                        if face_tensor is None:
                            continue
                        if face_tensor.dim() == 3:
                            face_tensor = face_tensor.unsqueeze(0)
                        face_tensor = face_tensor.to(device)
                        with torch.no_grad():
                            embedding = resnet(face_tensor)
                        identity, dist = compare_faces(embedding)
                        if identity == identity_from_filename:
                            match_count += 1
                            found_match = True
                            last_box = (int(x1), int(y1), int(x2), int(y2))
                            last_identity = identity
                            last_distance = dist
                            break
                if not found_match:
                    pass

            if last_box is not None and last_identity is not None:
                x1, y1, x2, y2 = last_box
                cv2.rectangle(frame, (x1, y1), (x2, y2), (0,255,0), 2)
                cv2.putText(frame, f"{last_identity} ({last_distance:.2f})",
                            (x1, y1-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0,255,0), 2)

            out_writer.write(frame)

        cap_video.release()
        out_writer.release()

        suffix = " VV" if match_count >= 3 else " VF"
        update_video_log(trigger_timestamp, suffix)
        
        new_base_name = base_name + suffix
        new_filename = new_base_name + ".mp4"
        new_video_path = os.path.join(CLIP_VIDEO_V_DIR, new_filename)
        try:
            with video_rename_lock:
                os.rename(out_video_temp, new_video_path)
            print(f"🔀 Processed video: {video_path} -> {new_video_path} (matches: {match_count})")
        except PermissionError as e:
            print(f"⚠️ Unable to rename processed video {out_video_temp} due to: {e}")
        try:
            os.remove(video_path)
        except Exception as e:
            print(f"⚠️ Could not delete old clip {video_path}: {e}")


##############################################
# New Utility: Update video log entry
##############################################
def update_video_log(timestamp, suffix):
    """
    Update the log file row that has the given timestamp,
    appending the suffix (e.g., " VV" or " VF").
    """
    try:
        with open(LOG_FILE, "r") as f:
            lines = f.readlines()
    except FileNotFoundError:
        lines = []
    new_lines = []
    updated = False
    for line in lines:
        if timestamp in line:
            line = line.rstrip("\n")
            # If not already updated, append the suffix
            if not line.endswith(suffix):
                line += suffix
            line += "\n"
            updated = True
        new_lines.append(line)
    # If not found, do nothing (or optionally add new line)
    with open(LOG_FILE, "w") as f:
        f.writelines(new_lines)


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
            identity = name if dist < 0.7 else "Unknown"
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
    print(f"📝 Logged: {log_entry.strip()}")

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
    global last_trigger_time, last_trigger_time_v, frame_buffer, fps, max_buffer

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("⚠️ Camera not opened.")
        return
    
    # Initialize frame buffer for video clip recording
    frame_buffer = []
    fps = 20
    max_buffer = fps * 10  # holds last 10 seconds

    print("========================================================")
    print("   Press 'c' to capture an image AND record a 15-sec video clip.")
    print("   Press 'r' to run face recognition immediately on captured images.")
    print("   Press 'v' to run face recognition immediately on clipped videos.")
    print("   Press 'q' to quit.")
    # print(f"   If {WAIT_TIME}s pass after your last capture, recognition runs automatically.")
    print(f"   If {WAIT_TIME}s pass after your last capture, recognition on images runs automatically.")
    print(f"   If {WAIT_TIME_V}s pass after your last capture, recognition on videos runs automatically.")
    print("========================================================")

    while True:

        # Display a live feed from the camera so we have an OpenCV window
        with cap_lock:  # modify: lock around camera read in main loop
            ret, frame = cap.read()
        if not ret:
            print("⚠️ Camera read failed.")
            break

         # Update frame buffer for clip recording
        frame_buffer.append(frame)
        if len(frame_buffer) > max_buffer:
            frame_buffer.pop(0)

        # Show the camera feed in a window (must keep this window in focus for keystrokes!)
        cv2.imshow("Press c/r/q in this window", frame)

        # 3) Check for key press in the OpenCV window
        key_code = cv2.waitKey(1) & 0xFF

        if key_code == ord('c'):
            # Capture one frame to RawPic/
            # capture_image(cap)
            # Also record a 15-sec video clip
            # threading.Thread(target=record_clip, args=(cap,)).start()  # modify: record clip asynchronously
            _, ts = capture_image(cap)
            if ts:
                threading.Thread(target=record_clip, args=(cap, ts)).start()
            # Reset both timers on a capture event
            last_trigger_time = time.time()
            last_trigger_time_v = time.time()

        elif key_code == ord('r'):
            # Manually run face recognition
            run_face_recognition_on_rawpics()
            last_trigger_time = 0
        
        elif key_code == ord('v'):
            print("🚀 Running face recognition on clipped videos...")
            threading.Thread(target=run_face_recognition_on_videos).start()
            last_trigger_time_v = 0  # Reset video FR timer

        elif key_code == ord('q'):
            print("👋 Exiting.")
            break

        # Auto-run recognition if WAIT_TIME has passed since last capture
        if time.time() - last_trigger_time >= WAIT_TIME and last_trigger_time != 0:
            print(f"{WAIT_TIME} seconds passed; running recognition on captured images now...")
            run_face_recognition_on_rawpics()
            last_trigger_time = 0

        if time.time() - last_trigger_time_v >= WAIT_TIME_V and last_trigger_time_v != 0:
            print(f"{WAIT_TIME_V} seconds passed; running recognition on clipped videos now...")
            threading.Thread(target=run_face_recognition_on_videos).start()
            last_trigger_time_v = 0

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
