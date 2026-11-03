from typing import Optional
from pydantic import BaseModel, EmailStr, Field, model_validator, field_validator
from app.models.user import CountryType
from app.utils.validators import validate_zip_code, get_states_for_country

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=8)
    phone_number: str = Field(..., min_length=5, max_length=50)
    country: CountryType
    state: str
    city: str
    zip_code: str
    dob: Optional[str] = None
    sex: Optional[str] = None

    @model_validator(mode="after")
    def validate_address_fields(self) -> "RegisterRequest":
        # Validate state/province based on country
        valid_states = get_states_for_country(self.country)
        if valid_states and self.state not in valid_states:
            raise ValueError(f"Invalid state/province '{self.state}' for country {self.country.value}")
        
        # Validate zip/postal code based on country
        if not validate_zip_code(self.country, self.zip_code):
            raise ValueError(f"Invalid ZIP/Postal code format '{self.zip_code}' for country {self.country.value}")
        
        return self

class LoginRequest(BaseModel):
    username: str
    password: str

class SendOTPRequest(BaseModel):
    email: EmailStr
    channel: str = "email" # "email" or "sms"

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)
    channel: str = "email" # "email" or "sms"
    method: Optional[str] = "email" # "totp" or "email"

    @field_validator("otp_code", mode="before")
    def strip_otp_code(cls, v):
        if isinstance(v, str):
            return v.strip()
        return v

class TwoFactorSetupResponse(BaseModel):
    secret: str
    otpauth_url: str
    qr_image_url: str

class TwoFactorVerifyRequest(BaseModel):
    code: str = Field(..., min_length=6, max_length=6)

class TwoFactorDisableRequest(BaseModel):
    code: str = Field(..., min_length=1, max_length=128)

class DeleteAccountVerifyRequest(BaseModel):
    otp_code: str = Field(..., min_length=6, max_length=6)

class CreatePinRequest(BaseModel):
    email: EmailStr
    pin: str = Field(..., min_length=4, max_length=4)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class ForgotPasswordRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)

class AdminRegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    admin_code: str = Field(..., min_length=4)

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str
