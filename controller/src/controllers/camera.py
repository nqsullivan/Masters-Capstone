import time
from picamera2 import Picamera2
from src.services.logging_service import printt

IMAGE_DIR = "/capstone/captures/"


class CameraController:
    def __init__(self):
        self.camera = None
        self.active = False

    def boot(self):
        """Boot up the camera."""
        self.camera = Picamera2()
        self.camera.configure(self.camera.create_still_configuration())
        self.camera.start()
        time.sleep(2)
        self.active = True
        printt("Camera booted and ready.")

    def turn_on(self):
        if not self.active:
            self.boot()
        printt("Camera is ON.")

    def take_picture(self, filename="image.jpg"):
        filename = IMAGE_DIR + filename
        if not self.active:
            raise Exception("Camera is not on.")
        printt(f"Taking picture and saving as {filename}...")
        self.camera.capture_file(filename)
        printt("Picture taken.")

        return filename

    def turn_off(self):
        # if self.camera:
        #     self.camera.close()
        # self.active = False
        printt("Camera is OFF.")
