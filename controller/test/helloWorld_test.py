import sys
import pytest

from src.helloWorld import helloWorld

def test_helloWorld(capsys):
    helloWorld()
    captured = capsys.readouterr()
    assert captured.out == "Hello, World!\n"
    assert captured.err == ""
