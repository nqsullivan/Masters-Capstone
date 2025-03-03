import time
import threading
import RPi.GPIO as GPIO


class UltrasonicController:
    def __init__(self, state_machine, trig_pin=23, echo_pin=24, threshold=50):
        self.state_machine = state_machine
        self.trig_pin = trig_pin
        self.echo_pin = echo_pin
        self.threshold = threshold
        self.running = True

        GPIO.setmode(GPIO.BCM)
        GPIO.setup(self.trig_pin, GPIO.OUT)
        GPIO.setup(self.echo_pin, GPIO.IN)

        print("Ultrasonic Controller initialized. Motion detection active.")

    def get_distance(self):
        """Measures the distance using the ultrasonic sensor with timeout handling."""
        GPIO.output(self.trig_pin, False)
        time.sleep(0.1)

        GPIO.output(self.trig_pin, True)
        time.sleep(0.00001)
        GPIO.output(self.trig_pin, False)

        start_time = time.time()

        while GPIO.input(self.echo_pin) == 0:
            pulse_start = time.time()
            if pulse_start - start_time > 0.02:
                return None

        while GPIO.input(self.echo_pin) == 1:
            pulse_end = time.time()
            if pulse_end - pulse_start > 0.02:
                return None

        pulse_duration = pulse_end - pulse_start
        distance = pulse_duration * 17150
        return round(distance, 2)

    def detect_motion(self):
        """Continuously monitors motion and sends events to the state machine."""
        last_distance = self.get_distance()

        if last_distance is None:
            return

        time.sleep(1)

        while self.running:
            current_distance = self.get_distance()

            if current_distance is None:
                time.sleep(0.5)
                continue

            if (
                current_distance < self.threshold
                and abs(current_distance - last_distance) > 5
            ):
                if self.state_machine:
                    self.state_machine.send_event(
                        "motion_detected", {"distance": current_distance}
                    )
                else:
                    print("StateMachine not initialized!")

                time.sleep(2)

            last_distance = current_distance
            time.sleep(0.5)

    def start(self):
        """Starts the motion detection thread."""
        self.thread = threading.Thread(target=self.detect_motion, daemon=True)
        self.thread.start()

    def stop(self):
        """Stops the motion detection thread and cleans up GPIO."""
        self.running = False
        self.thread.join()
        GPIO.cleanup()
