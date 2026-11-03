import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.validators import validate_aba_routing, get_bank_name_by_routing

client = TestClient(app)

def test_routing_checksum_validation():
    """
    Verifies standard US ABA routing transit number checksum validation.
    """
    # Valid Wells Fargo routing number
    assert validate_aba_routing("121000248") is True
    
    # Valid JPMorgan Chase routing number
    assert validate_aba_routing("021000021") is True
    
    # Valid Bank of America routing number
    assert validate_aba_routing("026009593") is True

    # Invalid: wrong length
    assert validate_aba_routing("12100024") is False
    
    # Invalid: non-numeric characters
    assert validate_aba_routing("12100024a") is False
    
    # Invalid: incorrect checksum digits
    assert validate_aba_routing("123456789") is False

def test_routing_bank_name_lookup():
    """
    Verifies bank name mapping lookup for known and unknown routing numbers.
    """
    # Known Wells Fargo
    assert get_bank_name_by_routing("121000248") == "Wells Fargo Bank, N.A."
    
    # Known JPMorgan Chase
    assert get_bank_name_by_routing("021000021") == "JPMorgan Chase Bank, N.A."
    
    # Valid checksum but unknown bank maps to generic fallback name
    assert get_bank_name_by_routing("011000015") == "Valid U.S. Financial Institution"

    # Test error raising for invalid routing number
    with pytest.raises(ValueError, match="Invalid routing number checksum"):
        get_bank_name_by_routing("123456789")

def test_routing_verification_api_endpoint():
    """
    Verifies the GET /api/transfers/verify-routing API route behavior.
    """
    from app.middleware.auth import get_current_user
    from app.models.user import User, CountryType
    
    # Mock user
    mock_user = User(
        country=CountryType.US
    )
    
    # Apply override
    app.dependency_overrides[get_current_user] = lambda: mock_user
    
    try:
        # Valid US routing number
        resp_valid = client.get("/api/transfers/verify-routing?routing_number=121000248")
        assert resp_valid.status_code == 200
        assert resp_valid.json()["valid"] is True
        assert "Wells Fargo" in resp_valid.json()["bank_name"]
        
        # Valid Canadian routing number
        mock_user.country = CountryType.CA
        resp_ca = client.get("/api/transfers/verify-routing?routing_number=000312345")
        assert resp_ca.status_code == 200
        assert resp_ca.json() == {
            "valid": True,
            "bank_name": "Royal Bank of Canada (RBC)",
            "error": None
        }
        
        # Invalid routing number
        mock_user.country = CountryType.US
        resp_invalid = client.get("/api/transfers/verify-routing?routing_number=123456789")
        assert resp_invalid.status_code == 200
        assert resp_invalid.json()["valid"] is False
    finally:
        # Clean up dependency override
        app.dependency_overrides.pop(get_current_user, None)
