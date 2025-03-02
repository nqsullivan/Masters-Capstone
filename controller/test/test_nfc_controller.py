import pytest
from unittest.mock import Mock, patch
from src.controllers.nfc import NFCController


@pytest.fixture
def mock_nfc():
    """Creates a mocked NFCController instance."""
    with patch("src.controllers.nfc.PN532_I2C") as MockPN532:
        nfc = NFCController()
        nfc.pn532 = MockPN532()
        return nfc


def test_nfc_initial_low_power(mock_nfc):
    """Test NFC starts in low-power mode."""
    assert mock_nfc.low_power is True


def test_nfc_enter_low_power_mode(mock_nfc):
    """Test NFC enters low-power mode."""
    mock_nfc.exit_low_power_mode()
    assert mock_nfc.low_power is False

    mock_nfc.enter_low_power_mode()
    assert mock_nfc.low_power is True


def test_nfc_exit_low_power_mode(mock_nfc):
    """Test NFC exits low-power mode."""
    mock_nfc.enter_low_power_mode()
    assert mock_nfc.low_power is True

    mock_nfc.exit_low_power_mode()
    assert mock_nfc.low_power is False
