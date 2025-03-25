import pytest
import time
from unittest.mock import Mock
from src.state_machine import StateMachine


@pytest.fixture
def mock_nfc_camera():
    """Creates mock NFC and Camera controllers for testing."""
    mock_nfc = Mock()
    mock_camera = Mock()
    return mock_nfc, mock_camera


@pytest.fixture
def mock_logger_api():
    """Creates mock Logger and APIService for testing."""
    mock_logger = Mock()
    mock_api_service = Mock()
    return mock_logger, mock_api_service


@pytest.fixture
def state_machine(mock_nfc_camera, mock_logger_api):
    """Creates a StateMachine instance with mocks."""
    mock_nfc, mock_camera = mock_nfc_camera
    mock_logger, mock_api_service = mock_logger_api
    sm = StateMachine(mock_nfc, mock_camera, mock_logger, mock_api_service)
    yield sm
    sm.stop()


def test_initial_state(state_machine):
    """Test that the initial state is IDLE."""
    assert state_machine.state == "IDLE"


def test_motion_detected_transition_to_active(state_machine):
    """Test motion detection moves state from IDLE to ACTIVE."""
    state_machine.send_event("motion_detected")
    time.sleep(0.1)
    assert state_machine.state == "ACTIVE"


def test_nfc_scan_in_active_transitions_to_streaming(state_machine):
    """Test NFC scan in ACTIVE state transitions to STREAMING."""
    state_machine.send_event("motion_detected")
    time.sleep(0.1)
    state_machine.send_event("nfc_scanned")
    time.sleep(0.1)
    assert state_machine.state == "STREAMING"


def test_streaming_timeout_moves_to_active(state_machine):
    """Test that after 60s in STREAMING, it transitions to ACTIVE."""
    state_machine.send_event("motion_detected")
    time.sleep(0.1)
    state_machine.send_event("nfc_scanned")
    time.sleep(0.1)

    state_machine.last_streaming_time = time.time() - 61
    state_machine.check_timeouts()

    assert state_machine.state == "ACTIVE"


def test_active_timeout_moves_to_idle(state_machine):
    """Test that after 20s in ACTIVE, it transitions to IDLE."""
    state_machine.send_event("motion_detected")
    time.sleep(0.1)

    state_machine.last_motion_time = time.time() - 21
    state_machine.check_timeouts()

    assert state_machine.state == "IDLE"
    state_machine.nfc_controller.enter_low_power_mode.assert_called_once()
    state_machine.camera_controller.turn_off.assert_called_once()
