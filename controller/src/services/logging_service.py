import requests


class LoggingService:
    _instance = None

    def __new__(cls, api_service, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(LoggingService, cls).__new__(cls)
            cls._instance.api_service = api_service
        return cls._instance

    def log(self, action, user_id="Controller", entity_type=None, entity_id=None):
        log_entry = {
            "userId": user_id,
            "action": action,
            "entityType": entity_type,
            "entityId": entity_id,
        }
        try:
            response = self.api_service.post("/log", json=log_entry)
            return response.status_code, response.json()
        except Exception as e:
            print(f"Logging failed: {e}")
            return None, None
