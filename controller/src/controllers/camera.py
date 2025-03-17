import time


class CameraController:
    def __init__(self):
        self.active = False

    def boot(self):
        """Boot up the camera."""
        self.active = True
        print("Camera booting...")

    def turn_on(self):
        """Turn on the camera."""
        if not self.active:
            self.boot()
        print("Camera is ON.")

    def turn_off(self):
        """Turn off the camera."""
        self.active = False
        print("Camera is OFF.")
