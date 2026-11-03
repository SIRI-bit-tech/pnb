import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.utils.security import generate_salt, hash_password, verify_password
from app.utils.validators import validate_zip_code, CountryType

client = TestClient(app)

def test_health_check():
    """
    Verifies the health check endpoint returns 200 and healthy status.
    """
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json() == {
        "status": "healthy",
        "service": "prescott-national-bank-backend",
        "version": "1.0.0"
    }

def test_password_hashing():
    """
    Verifies that the Argon2 password hashing utility hashes and validates correctly.
    """
    password = "SuperSecretPassword123!"
    salt = generate_salt()
    
    # Assert salt is generated as hex string
    assert len(salt) == 32
    
    pwd_hash = hash_password(password, salt)
    assert pwd_hash is not None
    assert pwd_hash.startswith("$argon2")
    
    # Assert verification succeeds
    assert verify_password(password, salt, pwd_hash) is True
    
    # Assert verification fails for wrong password
    assert verify_password("wrong_password", salt, pwd_hash) is False

def test_zip_code_validation():
    """
    Verifies country-specific postal code validation rules.
    """
    # US Zip Validation
    assert validate_zip_code(CountryType.US, "12345") is True
    assert validate_zip_code(CountryType.US, "12345-6789") is True
    assert validate_zip_code(CountryType.US, "1234") is False
    assert validate_zip_code(CountryType.US, "abcde") is False

    # Canada Postal Code Validation
    assert validate_zip_code(CountryType.CA, "K1A 0B1") is True
    assert validate_zip_code(CountryType.CA, "K1A0B1") is True
    assert validate_zip_code(CountryType.CA, "1A1 A1A") is False

    # UK Postcode Validation
    assert validate_zip_code(CountryType.UK, "EC1A 1BB") is True
    assert validate_zip_code(CountryType.UK, "W1A 0AX") is True
    assert validate_zip_code(CountryType.UK, "12345") is False
