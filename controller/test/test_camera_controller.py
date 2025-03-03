import pytest
from src.controllers.camera import CameraController


@pytest.fixture
def camera():
    """Creates a CameraController instance."""
    return CameraController()


def test_camera_initial_state(camera):
    """Test that the camera starts in OFF state."""
    assert camera.active is False


def test_camera_boots_properly(camera):
    """Test that calling boot() sets the camera to active."""
    camera.boot()
    assert camera.active is True


def test_camera_turn_on_when_already_booted(camera):
    """Test that calling turn_on() keeps the camera ON."""
    camera.boot()
    camera.turn_on()
    assert camera.active is True


def test_camera_turn_off(camera):
    """Test that calling turn_off() turns the camera off."""
    camera.turn_on()
    camera.turn_off()
    assert camera.active is False
