import sys
from unittest.mock import MagicMock

sys.modules["busio"] = MagicMock()
sys.modules["RPi"] = MagicMock()
sys.modules["RPi.GPIO"] = MagicMock()
sys.modules["adafruit_pn532.i2c"] = MagicMock()
sys.modules["adafruit_pn532"] = MagicMock()
