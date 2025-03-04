from src.state_machine import StateMachine
from src.controllers.nfc import NFCController
from src.controllers.ultrasonic import UltrasonicController
from src.controllers.camera import CameraController
import time

nfc = NFCController()
camera = CameraController()
sm = StateMachine(nfc, camera)
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
