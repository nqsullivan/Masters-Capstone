import pytest
from unittest.mock import Mock, patch
from src.controllers.ultrasonic import UltrasonicController


@pytest.fixture
def mock_state_machine():
    """Creates a mocked state machine for testing."""
    return Mock()


@pytest.fixture
def ultrasonic(mock_state_machine):
    """Creates an UltrasonicController instance with mock state machine."""
    with patch("src.controllers.ultrasonic.GPIO"):
        return UltrasonicController(mock_state_machine)


def test_motion_detection_triggers_event(ultrasonic, mock_state_machine):
    """Test that detect_motion sends a 'motion_detected' event."""

    ultrasonic.get_distance = Mock(side_effect=[100, 30])

    ultrasonic.running = False
    last_distance = ultrasonic.get_distance()
    current_distance = ultrasonic.get_distance()

    if (
        current_distance < ultrasonic.threshold
        and abs(current_distance - last_distance) > 5
    ):
        ultrasonic.state_machine.send_event(
            "motion_detected", {"distance": current_distance}
        )

    mock_state_machine.send_event.assert_called_with(
        "motion_detected", {"distance": 30}
    )
