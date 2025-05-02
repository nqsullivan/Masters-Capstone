from collections import deque
import cv2
import threading
import numpy as np
import time
from picamera2.encoders import MJPEGEncoder
from picamera2.outputs import FileOutput
from picamera2 import Picamera2
from src.services.logging_service import printt
import os
import subprocess

IMAGE_DIR = "/capstone/captures/"
CLIP_DIR = "/capstone/clips/"
BUFFER_SECONDS = 10
POST_SECONDS = 5
FPS = 20
MAX_FRAMES = BUFFER_SECONDS * FPS


class CameraController:
    def __init__(self):
        self.camera = None
        self.active = False
        self.buffer = deque(maxlen=MAX_FRAMES)
        self.recording_enabled = False
        self.lock = threading.Lock()

    def turn_on(self):
        if not self.active:
            printt("Camera turning on...")
            self.boot()
        else:
            printt("Camera already active.")

    def turn_off(self):
        if self.camera:
            printt("Camera turning off...")
            self.recording_enabled = False
            self.camera.stop()
            self.camera.close()
            self.camera = None
        self.active = False

    def take_picture(self, filename=None):
        if not self.active or not self.camera:
            raise Exception("Camera is not active. Cannot take picture.")

        if not filename:
            timestamp = time.strftime("%Y%m%d_%H%M%S")
            filename = f"{timestamp}.jpg"
        filepath = os.path.join(IMAGE_DIR, filename)

        printt(f"Taking picture and saving as {filepath}...")
        self.camera.capture_file(filepath)
        printt("Picture taken.")

        return filepath

    def boot(self):
        self.camera = Picamera2()
        self.camera.configure(
            self.camera.create_video_configuration(main={"size": (640, 480)})
        )
        self.camera.start()
        self.active = True

        self.recording_enabled = True
        threading.Thread(target=self._buffer_frames, daemon=True).start()

    def _buffer_frames(self):
        while self.recording_enabled:
            frame = self.camera.capture_array()
            with self.lock:
                self.buffer.append(frame)
            time.sleep(1.0 / FPS)

    def save_video_clip(self, filename):
        printt(f"Saving video clip: {filename}")
        os.makedirs(CLIP_DIR, exist_ok=True)

        if not filename.endswith(".mp4"):
            filename = filename.replace(".avi", "") + ".mp4"

        filepath = os.path.join(CLIP_DIR, filename)

        with self.lock:
            pre_trigger_frames = list(self.buffer)

        if not pre_trigger_frames:
            printt("No frames to write. Skipping clip.")
            return

        height, width = pre_trigger_frames[0].shape[:2]
        fourcc = cv2.VideoWriter_fourcc(*"mp4v")
        writer = cv2.VideoWriter(filepath, fourcc, FPS, (width, height))

        printt(f"Writing {len(pre_trigger_frames)} buffered frames...")

        for f in pre_trigger_frames:
            if f is None or f.size == 0:
                printt("Skipping empty frame")
                continue
            if f.shape[:2] != (height, width):
                f = cv2.resize(f, (width, height))
            f_bgr = cv2.cvtColor(f, cv2.COLOR_RGB2BGR)
            writer.write(f_bgr)

        start_time = time.time()
        while time.time() - start_time < POST_SECONDS:
            frame = self.camera.capture_array()
            if frame.shape[:2] != (height, width):
                frame = cv2.resize(frame, (width, height))
            f_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
            writer.write(f_bgr)
            time.sleep(1.0 / FPS)

        writer.release()

        printt(f"Clip saved: {filepath}")

        browser_path = self.convert_to_browser_compatible_mp4(filepath)
        return browser_path

    def convert_to_browser_compatible_mp4(self, input_path):
        output_path = input_path.replace(".mp4", "_browser.mp4")
        command = [
            "ffmpeg",
            "-y",
            "-i",
            input_path,
            "-c:v",
            "libx264",
            "-preset",
            "fast",
            "-crf",
            "23",
            "-c:a",
            "aac",
            "-b:a",
            "128k",
            "-movflags",
            "+faststart",
            output_path,
        ]
        try:
            subprocess.run(command, check=True)
            printt(f"Converted to browser-compatible MP4: {output_path}")
            os.remove(input_path)
            return output_path
        except subprocess.CalledProcessError as e:
            printt(f"FFmpeg conversion failed: {e}")
            return input_path
