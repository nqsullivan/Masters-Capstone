import unittest
from unittest.mock import patch, MagicMock
from src.services.api_service import APIService
import requests


class TestAPIService(unittest.TestCase):
    def setUp(self):
        self.base_url = "https://api.example.com"
        self.api_key = "test_api_key"
        self.api_service = APIService(base_url=self.base_url, api_key=self.api_key)

    @patch("requests.get")
    def test_get_success(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": "success"}
        mock_get.return_value = mock_response

        response = self.api_service.get("test-endpoint", params={"key": "value"})
        self.assertEqual(response, {"message": "success"})
        mock_get.assert_called_once_with(
            f"{self.base_url}/test-endpoint",
            headers=self.api_service.headers,
            params={"key": "value"},
        )

    @patch("requests.post")
    def test_post_success(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": "created"}
        mock_post.return_value = mock_response

        response = self.api_service.post("test-endpoint", json={"key": "value"})
        self.assertEqual(response, {"message": "created"})
        mock_post.assert_called_once_with(
            f"{self.base_url}/test-endpoint",
            headers=self.api_service.headers,
            json={"key": "value"},
        )

    @patch("requests.put")
    def test_put_success(self, mock_put):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": "updated"}
        mock_put.return_value = mock_response

        response = self.api_service.put("test-endpoint", json={"key": "value"})
        self.assertEqual(response, {"message": "updated"})
        mock_put.assert_called_once_with(
            f"{self.base_url}/test-endpoint",
            headers=self.api_service.headers,
            json={"key": "value"},
        )

    @patch("requests.delete")
    def test_delete_success(self, mock_delete):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"message": "deleted"}
        mock_delete.return_value = mock_response

        response = self.api_service.delete("test-endpoint")
        self.assertEqual(response, {"message": "deleted"})
        mock_delete.assert_called_once_with(
            f"{self.base_url}/test-endpoint",
            headers=self.api_service.headers,
        )

    @patch("requests.get")
    def test_get_failure(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 404
        mock_response.raise_for_status.side_effect = requests.HTTPError("Not Found")
        mock_get.return_value = mock_response

        with self.assertRaises(requests.HTTPError):
            self.api_service.get("invalid-endpoint")

    @patch("requests.post")
    def test_post_failure(self, mock_post):
        mock_response = MagicMock()
        mock_response.status_code = 500
        mock_response.raise_for_status.side_effect = requests.HTTPError("Server Error")
        mock_post.return_value = mock_response

        with self.assertRaises(requests.HTTPError):
            self.api_service.post("test-endpoint", json={"key": "value"})


if __name__ == "__main__":
    unittest.main()
