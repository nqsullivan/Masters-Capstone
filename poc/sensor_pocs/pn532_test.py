import board
import busio
from digitalio import DigitalInOut
from adafruit_pn532.i2c import PN532_I2C

# Initialize I²C bus
i2c = busio.I2C(board.SCL, board.SDA)
pn532 = PN532_I2C(i2c, debug=False)

# Check PN532 firmware version
ic, ver, rev, support = pn532.firmware_version
print(f"Found PN532 with firmware version: {ver}.{rev}")

# Configure to read NFC cards
pn532.SAM_configuration()

print("Waiting for an NFC card...")

while True:
    uid = pn532.read_passive_target(timeout=0.5)
    if uid:
        print(f"Card detected! UID: {''.join(format(x, '02X') for x in uid)}")
