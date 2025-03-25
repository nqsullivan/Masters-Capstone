import unittest
from unittest.mock import patch, MagicMock
from src.services.logging_service import LoggingService
from src.services.api_service import APIService
import requests


class TestLoggingService(unittest.TestCase):
    def setUp(self):
        LoggingService._instance = None
        self.mock_api_service = MagicMock(spec=APIService)
        self.logging_service = LoggingService(self.mock_api_service)

    @patch("src.services.api_service.requests.post")
    def test_log_success(self, mock_post):
        """Test that logging successfully sends data to the API"""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": "Log recorded"}

        mock_post.return_value = mock_response
        self.mock_api_service.post.return_value = mock_response

        status_code, response_json = self.logging_service.log(
            action="TEST_ACTION",
            userId="user123",
            entityType="TestEntity",
            entityId="entity123",
        )

        self.assertEqual(status_code, 200)
        self.assertEqual(response_json, {"message": "Log recorded"})
        self.mock_api_service.post.assert_called_once_with(
            "/logs",
            json={
                "userId": "user123",
                "action": "TEST_ACTION",
                "entityType": "TestEntity",
                "entityId": "entity123",
            },
        )

    @patch("src.services.api_service.requests.post")
    def test_log_failure(self, mock_post):
        """Test that logging handles API failure"""
        mock_post.side_effect = requests.RequestException("API is down")
        self.mock_api_service.post.side_effect = requests.RequestException(
            "API is down"
        )

        status_code, response_json = self.logging_service.log(
            action="TEST_ACTION",
            userId="user123",
            entityType="TestEntity",
            entityId="entity123",
        )

        self.assertIsNone(status_code)
        self.assertIsNone(response_json)
        self.mock_api_service.post.assert_called_once_with(
            "/logs",
            json={
                "userId": "user123",
                "action": "TEST_ACTION",
                "entityType": "TestEntity",
                "entityId": "entity123",
            },
        )

    @patch("src.services.api_service.requests.post")
    def test_log_failure_request_exception(self, mock_post):
        """Test that logging handles API failure"""
        mock_post.side_effect = requests.RequestException("API is down")
        self.mock_api_service.post.side_effect = requests.RequestException(
            "API is down"
        )

        status_code, response_json = self.logging_service.log(
            action="TEST_ACTION",
            userId="user123",
            entityType="TestEntity",
            entityId="entity123",
        )

        self.assertIsNone(status_code)
        self.assertIsNone(response_json)
        self.mock_api_service.post.assert_called_once_with(
            "/logs",
            json={
                "userId": "user123",
                "action": "TEST_ACTION",
                "entityType": "TestEntity",
                "entityId": "entity123",
            },
        )


if __name__ == "__main__":
    unittest.main()
