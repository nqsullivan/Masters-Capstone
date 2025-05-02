import time


class LoggingService:
    _instance = None

    def __new__(cls, api_service=None, *args, **kwargs):
        if cls._instance is None and api_service is not None:
            cls._instance = super().__new__(cls)
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
            self.api_service.post("/log", json=log_entry)
        except Exception as e:
            print(f"Logging failed: {e}")


def printt(message, *args, **kwargs):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    print(f"[{timestamp}]: {message}", *args, **kwargs)
    if LoggingService._instance:
        LoggingService._instance.log(message)
