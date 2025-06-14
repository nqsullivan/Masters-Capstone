import requests
import os

from src.services.logging_service import printt


class APIService:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(APIService, cls).__new__(cls)
        return cls._instance

    def __init__(self, base_url, api_key=None):
        if not hasattr(self, "initialized"):
            self.base_url = base_url
            self.api_key = api_key
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}" if self.api_key else None,
            }
            self.initialized = True

    def get(self, endpoint, params=None):
        endpoint = endpoint.lstrip("/")
        url = f"{self.base_url}/{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        return self._handle_response(response)

    def post(self, endpoint, json=None, files=None):
        endpoint = endpoint.lstrip("/")
        url = f"{self.base_url}/{endpoint}"
        if files:
            headers = {
                key: value
                for key, value in self.headers.items()
                if key != "Content-Type"
            }
            response = requests.post(url, headers=headers, data=json, files=files)
        else:
            response = requests.post(url, headers=self.headers, json=json)
        return self._handle_response(response)

    def put(self, endpoint, json=None):
        endpoint = endpoint.lstrip("/")
        url = f"{self.base_url}/{endpoint}"
        response = requests.put(url, headers=self.headers, json=json)
        return self._handle_response(response)

    def delete(self, endpoint):
        endpoint.lstrip("/")
        url = f"{self.base_url}/{endpoint}"
        response = requests.delete(url, headers=self.headers)
        return self._handle_response(response)

    def _handle_response(self, response):
        if response.status_code // 200:
            try:
                json_response = response.json()

                if (
                    isinstance(json_response, dict)
                    and "error" in json_response
                    and json_response["error"] == "Unauthorized"
                ):
                    print("Error: Unauthorized access (please check your API key)")
                    os._exit(1)

                return json_response
            except ValueError:
                print("Response is not valid JSON")
                return None
        else:
            print(f"Error: {response.status_code} - {response.text}")
            response.raise_for_status()
