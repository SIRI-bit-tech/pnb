from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from app.main import app

client = TestClient(app)

def test_contact_info_endpoint():
    response = client.get("/api/contact/info")
    assert response.status_code == 200
    data = response.json()
    assert data["institution"] == "Prescott National Bank, N.A."
    assert "California Street" in data["address"]["street"]
    assert "345" not in data["address"]["street"]
    assert "postal_code" not in data["address"]

def test_contact_submit_validation():
    # Empty payload should return 422 Unprocessable Entity
    response = client.post("/api/contact/submit", json={})
    assert response.status_code == 422

    # Invalid email should return 422
    response = client.post("/api/contact/submit", json={
        "name": "Jane Doe",
        "email": "invalid-email-format",
        "category": "General Inquiry",
        "message": "Hello, I would like to learn more about Prescott National Bank accounts."
    })
    assert response.status_code == 422

@patch("app.routers.contact.send_contact_inquiry_emails", new_callable=AsyncMock)
def test_contact_submit_success(mock_send):
    mock_send.return_value = {
        "staff_notified": True,
        "confirmation_sent": True,
        "assigned_email": "support@prescottnational.com",
        "errors": []
    }

    payload = {
        "name": "Victoria Sterling",
        "email": "victoria.sterling@example.com",
        "category": "Institutional & Commercial Finance",
        "subject": "Commercial Line of Credit Inquiry",
        "message": "We are seeking information regarding treasury management solutions and high-yield commercial accounts."
    }

    response = client.post("/api/contact/submit", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["reference_id"].startswith("PNB-CNT-")
    assert data["assigned_email"] == "support@prescottnational.com"
    assert data["staff_notified"] is True
    assert data["confirmation_sent"] is True

    # Check mock was called with correct parameters
    mock_send.assert_awaited_once()
