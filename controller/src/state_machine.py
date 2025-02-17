from transitions import Machine


class StateMachine:
    states = ['OFF', 'IDLE', 'STREAMING', 'ACTIVE']

    def __init__(self):
        self.state = 'OFF'  # Explicitly declare the state attribute
        self.machine = Machine(model=self, states=StateMachine.states, initial=self.state)

        # Define transitions
        self.machine.add_transition(trigger='boot_up', source='OFF', dest='IDLE')
        self.machine.add_transition(trigger='motion_detected', source='IDLE', dest='STREAMING')
        self.machine.add_transition(trigger='nfc_scanned', source='STREAMING', dest='ACTIVE')
        self.machine.add_transition(trigger='finish_analyzing_face', source='ACTIVE', dest='STREAMING')
        self.machine.add_transition(trigger='timeout', source='STREAMING', dest='IDLE')
        self.machine.add_transition(trigger='shutdown', source=['IDLE', 'STREAMING', 'ACTIVE'], dest='OFF')

    def current_state(self):
        return self.state  # This ensures the state is accessible


# Example usage
if __name__ == "__main__":
    sm = StateMachine()
    print(f"Initial State: {sm.state}")
    sm.boot_up()
    print(f"State after boot_up: {sm.state}")
    sm.motion_detected()
    print(f"State after motion_detected: {sm.state}")

