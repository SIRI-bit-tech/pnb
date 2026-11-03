import secrets
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from app.config import get_settings

settings = get_settings()

# Configure the Argon2 Password Hasher with standard secure parameters.
ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4
)

def generate_salt() -> str:
    """
    Generates a cryptographically secure 32-character hex salt.
    """
    return secrets.token_hex(16)

def hash_password(password: str, salt: str) -> str:
    """
    Hashes a password combined with a user-specific salt and a global server pepper.
    Returns the Argon2 hash string.
    """
    pepper = settings.PEPPER_KEY
    # Combine password + salt + pepper
    combined = f"{password}{salt}{pepper}"
    return ph.hash(combined)

def verify_password(password: str, salt: str, password_hash: str) -> bool:
    """
    Verifies a password against the stored Argon2 hash using the user-specific salt and global pepper.
    """
    pepper = settings.PEPPER_KEY
    combined = f"{password}{salt}{pepper}"
    try:
        return ph.verify(password_hash, combined)
    except VerifyMismatchError:
        return False
