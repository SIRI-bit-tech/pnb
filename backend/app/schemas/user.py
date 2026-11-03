import uuid
from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr, model_validator, Field, field_serializer
from app.models.user import CountryType, UserRole, CurrencyType
from app.utils.validators import validate_zip_code, get_states_for_country

class AccountResponse(BaseModel):
    id: uuid.UUID
    balance: Decimal
    checking_balance: Decimal
    checking_account_number: Optional[str] = Field(None, serialization_alias="checkingAccountNumber")
    savings_balance: Decimal
    savings_account_number: Optional[str] = Field(None, serialization_alias="savingsAccountNumber")
    credit_balance: Decimal
    credit_account_number: Optional[str] = Field(None, serialization_alias="creditAccountNumber")
    currency: CurrencyType
    account_number: Optional[str] = Field(None, serialization_alias="accountNumber")
    routing_number: Optional[str] = Field(None, serialization_alias="routingNumber")
    is_active: bool
    is_frozen: bool
    freeze_reason: Optional[str] = Field(None, serialization_alias="freezeReason")
    show_spending_summary: bool = True

    @field_serializer("balance", "checking_balance", "savings_balance", "credit_balance", check_fields=False)
    def serialize_decimal(self, v: Decimal, _info):
        if v is not None:
            return float(round(Decimal(str(v)), 2))
        return 0.0

    class Config:
        from_attributes = True
        populate_by_name = True

class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str
    full_name: str
    phone_number: Optional[str] = None
    country: CountryType
    state: str
    city: str
    zip_code: str
    dob: Optional[str] = None
    sex: Optional[str] = None
    profile_image_url: Optional[str] = None
    is_verified: bool
    is_approved: bool = False
    is_active: bool
    ban_reason: Optional[str] = None
    two_factor_enabled: bool = False
    role: UserRole
    currency: CurrencyType
    created_at: Optional[datetime] = None
    account: Optional[AccountResponse] = None

    class Config:
        from_attributes = True

class ProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    phone_number: Optional[str] = None
    country: Optional[CountryType] = None
    state: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    dob: Optional[str] = None
    sex: Optional[str] = None
    profile_image_url: Optional[str] = None

    @model_validator(mode="after")
    def validate_address_updates(self) -> "ProfileUpdateRequest":
        country = self.country
        state = self.state
        zip_code = self.zip_code

        if country or state or zip_code:
            if country and state:
                valid_states = get_states_for_country(country)
                if valid_states and state not in valid_states:
                    raise ValueError(f"Invalid state/province '{state}' for country {country.value}")
            if country and zip_code:
                if not validate_zip_code(country, zip_code):
                    raise ValueError(f"Invalid ZIP/Postal code format '{zip_code}' for country {country.value}")
        
        return self

class SecurityUpdateRequest(BaseModel):
    current_password: Optional[str] = None
    new_password: Optional[str] = None
    current_pin: Optional[str] = None
    new_pin: Optional[str] = None
