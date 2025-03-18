import requests


class AttendanceService:
    _instance = None

    def __new__(cls, api_service, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(AttendanceService, cls).__new__(cls)
            cls._instance.api_service = api_service
        return cls._instance

    def post_attendance(self, user_id, event_id):
        # TODO implement this method
        pass
