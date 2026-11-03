import hmac
import hashlib
import time
import struct
import base64
import secrets
import urllib.parse
from typing import Optional

def generate_totp_secret() -> str:
    """
    Generates a 160-bit random base32 secret compatible with Google Authenticator,
    Authy, Microsoft Authenticator, and 1Password.
    """
    return base64.b32encode(secrets.token_bytes(20)).decode("utf-8").replace("=", "")

def get_totp_uri(secret: str, email: str, issuer: str = "Prescott National Bank") -> str:
    """
    Generates the standard otpauth:// URL for QR code generation.
    """
    encoded_issuer = urllib.parse.quote(issuer)
    encoded_email = urllib.parse.quote(email)
    return f"otpauth://totp/{encoded_issuer}:{encoded_email}?secret={secret}&issuer={encoded_issuer}&algorithm=SHA1&digits=6&period=30"

def get_totp_token(secret: str, interval: int) -> str:
    """
    Computes a 6-digit TOTP token for a given 30-second time interval per RFC 6238.
    """
    # Pad secret with '=' to reach multiple of 8 for base32 decoding
    padding = (8 - len(secret) % 8) % 8
    key = base64.b32decode(secret + ("=" * padding), casefold=True)
    msg = struct.pack(">Q", interval)
    h = hmac.new(key, msg, hashlib.sha1).digest()
    o = h[19] & 15
    code = (struct.unpack(">I", h[o : o + 4])[0] & 0x7FFFFFFF) % 1000000
    return str(code).zfill(6)

def verify_totp_code(secret: Optional[str], code: str, window: int = 1) -> bool:
    """
    Verifies a 6-digit TOTP code against the secret with a clock drift window (default ±30s).
    """
    if not secret:
        return False
    try:
        code_str = str(code).strip()
        if len(code_str) != 6 or not code_str.isdigit():
            return False
        curr_interval = int(time.time()) // 30
        for offset in range(-window, window + 1):
            if get_totp_token(secret, curr_interval + offset) == code_str:
                return True
        return False
    except Exception:
        return False
