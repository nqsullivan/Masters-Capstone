class LoggingService:
    _instance = None

    def __new__(cls, api_service, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(LoggingService, cls).__new__(cls)
            cls._instance.api_service = api_service
        return cls._instance

    def log(self, action, userId="Controller", entityType="", entityId=""):
        log_entry = {
            "userId": userId,
            "action": action,
            "entityType": entityType,
            "entityId": entityId,
        }
        try:
            return self.api_service.post("/log", json=log_entry)
        except Exception as e:
            print(f"Logging failed: {e}")
            return None, None
