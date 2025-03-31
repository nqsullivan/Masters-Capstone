import requests
import time
from datetime import date
from datetime import datetime

from src.services.logging_service import printt


class AttendanceService:
    _instance = None

    def __new__(cls, api_service, camera_controller, room_number, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(AttendanceService, cls).__new__(cls)
            cls._instance.api_service = api_service
            cls._instance.camera_controller = camera_controller
            cls._instance.room_number = room_number
            cls._instance.schedule = cls._instance.get_schedule()
            cls._instance.current_class = cls._instance.get_current_class()
            cls._instance.current_session = cls._instance.create_session()
        return cls._instance

    def handle_attendance_event(self, nfc_event):
        """Handles attendance events."""

        printt("Handling attendance event...")

        if nfc_event is None:
            printt("No NFC event data received.")
            return

        class_id = self.get_current_class()

        if self.current_class != self.get_current_class():
            self.current_class = class_id
            self.current_session = self.create_session()
            if not self.current_session:
                printt("Failed to create session.")
                return

        if self.current_session is None:
            self.current_session = self.create_session()
            if not self.current_session:
                printt("Failed to create session.")
                return

        attend_event = {
            "studentId": nfc_event.get("card_id"),
            "checkInTime": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "portraitURL": None,
        }

        try:
            filename = f"capture_{int(time.time())}.jpg"
            full_picture_path = self.camera_controller.take_picture(filename=filename)
            printt(f"Picture saved as {filename}")
        except Exception as e:
            printt(f"Error taking picture: {e}")

        if full_picture_path:
            try:
                with open(full_picture_path, "rb") as f:
                    response = self.api_service.post("/image", files={"image": f})

                    if response.get("error"):
                        printt("Error uploading image:", response["error"])
                        raise Exception("Image upload failed.")

                    printt("Image upload response:", str(response))

                    image_url = response.get("message", {}).get("fileUrl")
                    if image_url:
                        printt(f"Image uploaded successfully: {image_url}")
                        attend_event["portraitURL"] = image_url

            except requests.RequestException as e:
                printt(f"Error uploading image: {e}")

        try:
            response = self.api_service.post(
                f"/session/{self.current_session.get('id')}/attendance",
                json=attend_event,
            )
            printt(f"Attendance event logged: {response}")
        except requests.RequestException as e:
            printt(f"Error logging attendance event: {e}")

    def get_schedule(self):
        """Fetches the schedule from the API."""
        try:
            response = self.api_service.get("/schedule/" + self.room_number)
            if response:
                return response
        except requests.RequestException as e:
            print(f"Error fetching schedule: {e}")
            return None

    def get_current_class(self):
        """Returns the current class ID based on the schedule using endtimes."""
        current_time = time.strftime("%H:%M")

        if self.schedule:
            current_class = None
            self.schedule.sort(key=lambda x: x["endTime"])

            for class_info in self.schedule:
                end_time = class_info["endTime"]
                if current_time < end_time:
                    current_class = class_info
                    break

            if current_class:
                return current_class
            else:
                printt("No current class found.")
                return None

        return None

    def create_session(self):
        """Creates a new session for the given class ID."""
        start_str = self.current_class.get("startTime")
        end_str = self.current_class.get("endTime")

        start_time = datetime.strptime(start_str, "%H:%M:%S").time()
        end_time = datetime.strptime(end_str, "%H:%M:%S").time()

        today = date.today()
        start_datetime = datetime.combine(today, start_time).strftime(
            "%Y-%m-%d %H:%M:%S"
        )
        end_datetime = datetime.combine(today, end_time).strftime("%Y-%m-%d %H:%M:%S")

        session_data = {
            "startTime": start_datetime,
            "endTime": end_datetime,
            "classId": self.current_class.get("id"),
        }

        try:
            response = self.api_service.post("/session", json=session_data)
            printt(f"Session created: {response}")
            return response
        except requests.RequestException as e:
            print(f"Error creating session: {e}")
            return None
