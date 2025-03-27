from src.state_machine import StateMachine
from src.controllers.nfc import NFCController
from src.controllers.ultrasonic import UltrasonicController
from src.controllers.camera import CameraController
from src.services.api_service import APIService
from src.services.logging_service import LoggingService
import time
import os

API_URL = os.getenv("API_URL")
API_KEY = os.getenv("API_KEY")

if not API_URL or not API_KEY:
    print("API_URL and API_KEY environment variables must be set", API_KEY, API_URL)
    raise ValueError("API_URL and API_KEY environment variables must be set")

api_service = APIService(base_url=API_URL, api_key=API_KEY)
logger = LoggingService(api_service)

nfc = NFCController()
camera = CameraController()
sm = StateMachine(nfc, camera, logger, api_service)
ultrasonic = UltrasonicController(sm)

nfc.start(sm)
ultrasonic.start()

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nShutting down...")
    nfc.stop()
    ultrasonic.stop()
    sm.stop()
