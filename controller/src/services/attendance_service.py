import requests
import time
from datetime import date
from datetime import datetime

from src.services.logging_service import printt


class AttendanceService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(AttendanceService, cls).__new__(cls)
        return cls._instance

    def __init__(
        self, api_service, camera_controller, face_recognition_service, room_number
    ):
        if not hasattr(self, "initialized"):
            self.studentId_to_attendanceId = {}
            self.api_service = api_service
            self.camera_controller = camera_controller
            self.face_recognition_service = face_recognition_service
            self.room_number = room_number
            self.schedule = self.get_schedule()
            self.current_class = self.get_current_class()
            self.current_session = self.create_session()
            self.initialized = True

    def handle_attendance_event(self, nfc_event):
        printt("Handling attendance event...")

        if nfc_event is None:
            printt("No NFC event data received.")
            return

        class_id = self.get_current_class()

        if self.current_class != class_id:
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

        try:
            filename = f"capture_{int(time.time())}.jpg"
            full_picture_path = self.camera_controller.take_picture(filename=filename)
            printt(f"Picture saved as {filename}")
        except Exception as e:
            printt(f"Error taking picture: {e}")
            return

        portrait_url = None
        student_id = nfc_event.get("card_id")

        try:
            recognition_results = self.face_recognition_service.run_on_image(
                full_picture_path
            )
            if recognition_results:
                primary_result = recognition_results[0]
                portrait_path = primary_result.get("croppedPath")
                identity = primary_result.get("identity")

                with open(portrait_path, "rb") as f:
                    response = self.api_service.post("/image", files={"image": f})

                if response.get("error"):
                    printt("Error uploading image:", response["error"])
                    raise Exception("Image upload failed.")

                image_url = response.get("message", {}).get("fileUrl")
                if image_url:
                    printt(f"Image uploaded successfully: {image_url}")
                    portrait_url = image_url
                    # TODO
                    # if identity != "Unknown" and identity != student_id
                    #     flagged = True
        except Exception as e:
            printt(f"Error during facial recognition or image upload: {e}")

        try:
            response = self.api_service.put(
                f"/attendance/{self.studentId_to_attendanceId.get(student_id)}",
                json={
                    "FRIdentifiedId": "" if identity == "Unknown" else identity,
                    "checkIn": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "portraitUrl": portrait_url,
                },
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
            session = self.api_service.post("/session", json=session_data)
            self.current_session = session
            printt(f"Session created: {session}")
        except requests.RequestException as e:
            print(f"Error creating session: {e}")
            return None

        try:
            student_ids = self.api_service.get(
                f"/class/{self.current_class.get('id')}/students"
            )

            for studentId in student_ids:
                attendance_data = {"studentId": studentId}
                attendance_record = self.api_service.post(
                    f"/session/{self.current_session.get('id')}/attendance",
                    json=attendance_data,
                )

                print(
                    f"Attendance record created for student {studentId}: {attendance_record.get('id')}"
                )

                self.studentId_to_attendanceId[studentId] = attendance_record.get("id")

            printt(
                f"Attendance records inserted for session {self.current_session.get('id')}"
            )
        except requests.RequestException as e:
            print(f"Error inserting attendance records: {e}")
            return None
        except Exception as e:
            print(f"Unexpected error: {e}")
            return None

        return session
