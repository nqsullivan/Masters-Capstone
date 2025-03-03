import time
import busio
from adafruit_pn532.i2c import PN532_I2C
import threading


class NFCController:
    SCL_PIN = 3
    SDA_PIN = 2
    IDLE_POLLING_INTERVAL = 5
    ACTIVE_POLLING_INTERVAL = 0.5

    def __init__(self):
        self.running = True
        self.low_power = True

        i2c = busio.I2C(self.SCL_PIN, self.SDA_PIN)
        self.pn532 = PN532_I2C(i2c, debug=False)
        self.pn532.SAM_configuration()
        print("NFC Controller initialized. Waiting for NFC cards...")

    def enter_low_power_mode(self):
        """Reduce polling frequency when in low-power mode."""
        self.low_power = True
        print("NFC module entering software low-power mode.")

    def exit_low_power_mode(self):
        """Increase polling frequency when in active mode."""
        self.low_power = False
        print("NFC module is now active.")

    def read_nfc(self, state_machine):
        """Reads NFC tags at a lower frequency in low-power mode."""
        while self.running:
            polling_interval = (
                self.IDLE_POLLING_INTERVAL
                if self.low_power
                else self.ACTIVE_POLLING_INTERVAL
            )
            try:
                uid = self.pn532.read_passive_target(timeout=polling_interval)

                if uid:
                    card_id = "".join(format(x, "02X") for x in uid)
                    state_machine.send_event("nfc_scanned", {"card_id": card_id})
                    time.sleep(2)

            except RuntimeError as e:
                print(f"NFC read error: {e}")
                time.sleep(polling_interval)

    def start(self, state_machine):
        """Start NFC reading thread."""
        self.thread = threading.Thread(
            target=self.read_nfc, args=(state_machine,), daemon=True
        )
        self.thread.start()

    def stop(self):
        """Stop NFC and enter low-power mode."""
        self.running = False
        self.thread.join()
        self.enter_low_power_mode()
