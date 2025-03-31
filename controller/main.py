from src.state_machine import StateMachine
from src.controllers.nfc import NFCController
from src.controllers.ultrasonic import UltrasonicController
from src.controllers.camera import CameraController
from src.services.api_service import APIService
from src.services.attendance_service import AttendanceService
from src.services.logging_service import LoggingService, printt
import time
import os

API_URL = os.getenv("API_URL")
API_KEY = os.getenv("API_KEY")
ROOM_NUMBER = os.getenv("ROOM_NUMBER")

if not API_URL or not API_KEY or not ROOM_NUMBER:
    print("API_URL, API_KEY, and ROOM_NUMBER environment variables must be set")
    raise ValueError("Missing environment variables")

nfc = NFCController()
camera = CameraController()

api_service = APIService(base_url=API_URL, api_key=API_KEY)
logger = LoggingService(api_service)
attendance_service = AttendanceService(api_service, camera, ROOM_NUMBER)

sm = StateMachine(nfc, camera, logger, api_service, attendance_service)
ultrasonic = UltrasonicController(sm)

nfc.start(sm)
ultrasonic.start()

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    printt("\nShutting down...")
    nfc.stop()
    ultrasonic.stop()
    sm.stop()
