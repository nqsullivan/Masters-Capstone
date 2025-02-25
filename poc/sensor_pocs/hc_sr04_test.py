import time
import RPi.GPIO as GPIO

TRIG = 23
ECHO = 24

GPIO.setmode(GPIO.BCM)
GPIO.setup(TRIG, GPIO.OUT)
GPIO.setup(ECHO, GPIO.IN)

# Motion detection threshold (in cm)
MOTION_THRESHOLD = 50
DETECTION_COOLDOWN = 2

def get_distance():
    """Measure the distance using the HC-SR04 sensor."""
    GPIO.output(TRIG, False)
    time.sleep(0.1)

    # Send a 10µs pulse to trigger measurement
    GPIO.output(TRIG, True)
    time.sleep(0.00001)
    GPIO.output(TRIG, False)

    # Measure the time of the echo pulse
    pulse_start = time.time()
    while GPIO.input(ECHO) == 0:
        pulse_start = time.time()

    pulse_end = time.time()
    while GPIO.input(ECHO) == 1:
        pulse_end = time.time()

    # Calculate distance (Speed of sound: 34300 cm/s, divided by 2 for round-trip)
    pulse_duration = pulse_end - pulse_start
    distance = (pulse_duration * 17150)
    return round(distance, 2)

def detect_motion():
    """Monitor for motion by checking if an object enters the threshold zone."""
    print("Motion detector active. Waiting for movement...")

    last_distance = get_distance()
    time.sleep(1)

    while True:
        current_distance = get_distance()

        if current_distance < MOTION_THRESHOLD and abs(current_distance - last_distance) > 5:
            print(f"Motion detected! Object at {current_distance} cm")
            time.sleep(DETECTION_COOLDOWN)
        else:
            print(f"No motion. Distance: {current_distance} cm")

        last_distance = current_distance
        time.sleep(0.5)

try:
    detect_motion()

except KeyboardInterrupt:
    print("\nExiting...")
    GPIO.cleanup()

