from src.helloWorld import helloWorld
from src.state_machine import StateMachine

if __name__ == "__main__":
    helloWorld()

    sm = StateMachine()
    print(f"Initial State: {sm.state}")

    sm.boot_up()
    print(f"State after boot_up: {sm.state}")

    sm.motion_detected()
    print(f"State after motion_detected: {sm.state}")

'''
Notes about state machine: 
The 'state' attribute and transition methods are dynamically created by the 'transitions' library.
Some IDEs might show "Unresolved attribute reference" warnings here. These prompts do not affect any functionality and can be ignored.
'''
