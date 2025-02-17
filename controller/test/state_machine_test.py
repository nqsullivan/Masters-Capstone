import pytest
from src.state_machine import StateMachine


def test_initial_state():
    sm = StateMachine()
    assert sm.state == "OFF"


def test_boot_up_transition():
    sm = StateMachine()
    sm.boot_up()
    assert sm.state == "IDLE"


def test_motion_detected_transition():
    sm = StateMachine()
    sm.boot_up()
    sm.motion_detected()
    assert sm.state == "STREAMING"


def test_nfc_scanned_transition():
    sm = StateMachine()
    sm.boot_up()
    sm.motion_detected()
    sm.nfc_scanned()
    assert sm.state == "ACTIVE"


def test_finish_analyzing_face_transition():
    sm = StateMachine()
    sm.boot_up()
    sm.motion_detected()
    sm.nfc_scanned()
    sm.finish_analyzing_face()
    assert sm.state == "STREAMING"


def test_timeout_transition():
    sm = StateMachine()
    sm.boot_up()
    sm.motion_detected()
    sm.nfc_scanned()
    sm.finish_analyzing_face()
    sm.timeout()
    assert sm.state == "IDLE"


def test_shutdown_transition():
    sm = StateMachine()
    sm.boot_up()
    sm.shutdown()
    assert sm.state == "OFF"

    sm.boot_up()
    sm.motion_detected()
    sm.shutdown()
    assert sm.state == "OFF"

    sm.boot_up()
    sm.motion_detected()
    sm.nfc_scanned()
    sm.shutdown()
    assert sm.state == "OFF"
