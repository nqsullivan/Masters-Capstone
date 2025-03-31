import queue
import threading
import time

from src.services.logging_service import printt

LOOP_DELAY = 0.5
ACTIVE_TIMEOUT = 20
STREAMING_TIMEOUT = 60


class StateMachine:
    states = ["IDLE", "ACTIVE", "STREAMING"]

    def __init__(
        self,
        nfc_controller,
        camera_controller,
        logging_service,
        api_service,
        attendance_service,
    ):
        self.nfc_controller = nfc_controller
        self.camera_controller = camera_controller
        self.state = "IDLE"
        self.event_queue = queue.Queue()
        self.running = True
        self.last_motion_time = None
        self.last_streaming_time = None
        self.logging_service = logging_service
        self.api_service = api_service
        self.attendance_service = attendance_service

        self.event_thread = threading.Thread(target=self.process_events, daemon=True)
        self.event_thread.start()

    def process_events(self):
        """Continuously processes events from the queue."""
        while self.running:
            try:
                event, data = self.event_queue.get(timeout=LOOP_DELAY)
                self.handle_event(event, data)
            except queue.Empty:
                pass

            self.check_timeouts()

    def handle_event(self, event_name, event_data):
        """Handles state transitions based on events."""
        printt(f"Event received: {event_name}")

        if event_name in ["motion_detected", "nfc_scanned"] and self.state == "IDLE":
            self.transition_to("ACTIVE")

        if event_name == "nfc_scanned" and (
            self.state == "ACTIVE" or self.state == "STREAMING"
        ):
            self.transition_to("STREAMING")
            self.attendance_service.handle_attendance_event(event_data)

    def transition_to(self, new_state):
        """Executes the transition between states."""
        if self.state != new_state:
            printt(f"Transitioning from {self.state} to {new_state}")
            self.state = new_state

            if new_state == "IDLE":
                self.nfc_controller.enter_low_power_mode()
                self.camera_controller.turn_off()

            elif new_state == "ACTIVE":
                self.nfc_controller.exit_low_power_mode()
                self.camera_controller.turn_on()
                self.last_motion_time = time.time()

            elif new_state == "STREAMING":
                self.camera_controller.turn_on()
                self.last_streaming_time = time.time()

    def check_timeouts(self):
        """Handles automatic time-based transitions."""
        current_time = time.time()

        if self.state == "ACTIVE" and self.last_motion_time:
            if current_time - self.last_motion_time > ACTIVE_TIMEOUT:
                printt("Timeout: No motion for 20s. Returning to IDLE.")
                self.transition_to("IDLE")

        elif self.state == "STREAMING" and self.last_streaming_time:
            if current_time - self.last_streaming_time > STREAMING_TIMEOUT:
                printt("Timeout: No NFC scan for 1 min. Returning to ACTIVE.")
                self.transition_to("ACTIVE")

    def send_event(self, event_name, event_data=None):
        """Adds an event to the queue for processing."""
        self.event_queue.put((event_name, event_data))

    def stop(self):
        """Stops the state machine."""
        self.running = False
        self.event_thread.join()
