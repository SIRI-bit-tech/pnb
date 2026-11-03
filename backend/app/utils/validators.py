import re
from typing import List
from app.models.user import CountryType, CurrencyType

# Regex patterns for country-specific ZIP/Postal codes
US_ZIP_PATTERN = re.compile(r"^\d{5}(-\d{4})?$")
CA_POSTAL_PATTERN = re.compile(r"^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$")
UK_POSTAL_PATTERN = re.compile(r"^[A-Za-z]{1,2}\d[A-Za-z\d]? ?\d[A-Za-z]{2}$")

EMAIL_PATTERN = re.compile(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")

# Predefined state/province lists for US, Canada, UK
US_STATES = [
    "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", 
    "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", 
    "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", 
    "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", 
    "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
]

CA_PROVINCES = [
    "AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"
]

UK_REGIONS = [
    "England", "Scotland", "Wales", "Northern Ireland"
]

def validate_zip_code(country: CountryType, zip_code: str) -> bool:
    """
    Validates the ZIP/Postal code format based on the selected country.
    """
    cleaned_zip = zip_code.strip()
    if country == CountryType.US:
        return bool(US_ZIP_PATTERN.match(cleaned_zip))
    elif country == CountryType.CA:
        return bool(CA_POSTAL_PATTERN.match(cleaned_zip))
    elif country == CountryType.UK:
        return bool(UK_POSTAL_PATTERN.match(cleaned_zip))
    return False

def validate_email(email: str) -> bool:
    """
    Validates email format using RFC-compliant regex.
    """
    return bool(EMAIL_PATTERN.match(email.strip()))

def get_states_for_country(country: CountryType) -> List[str]:
    """
    Returns list of states, provinces, or regions based on country type.
    """
    if country == CountryType.US:
        return US_STATES
    elif country == CountryType.CA:
        return CA_PROVINCES
    elif country == CountryType.UK:
        return UK_REGIONS
    return []

def get_currency_for_country(country: CountryType) -> CurrencyType:
    """
    Maps country to their local currency code.
    """
    if country == CountryType.UK:
        return CurrencyType.GBP
    elif country == CountryType.CA:
        return CurrencyType.CAD
    return CurrencyType.USD

def validate_aba_routing(routing_number: str) -> bool:
    """
    Validates a US routing transit number (9 digits) using the standard ABA checksum formula.
    """
    if not routing_number or not routing_number.isdigit() or len(routing_number) != 9:
        return False
        
    d = [int(x) for x in routing_number]
    checksum = (
        3 * (d[0] + d[3] + d[6]) +
        7 * (d[1] + d[4] + d[7]) +
        1 * (d[2] + d[5] + d[8])
    )
    return checksum % 10 == 0

MAJOR_US_BANKS_ROUTING = {
    "121175254": "Prescott National Bank, N.A.",
    "021000021": "JPMorgan Chase Bank, N.A.",
    "121000248": "Wells Fargo Bank, N.A.",
    "026009593": "Bank of America, N.A.",
    "021000089": "Citibank, N.A.",
    "031100209": "PNC Bank, N.A.",
    "051000017": "Capital One, N.A.",
    "091000022": "U.S. Bank, N.A.",
    "321171184": "TD Bank, N.A.",
    "061000052": "Truist Bank",
    "122000247": "Bank of America, N.A. (CA)",
    "121000024": "Wells Fargo Bank, N.A. (CA)",
    "021202337": "HSBC Bank USA, N.A.",
    "043000096": "KeyBank, N.A.",
    "021001486": "The Bank of New York Mellon",
    "071000039": "JPMorgan Chase Bank, N.A. (IL)",
    "111000614": "Bank of America, N.A. (TX)"
}

def get_bank_name_by_routing(routing_number: str) -> str:
    """
    Returns the mapped bank name if it is in the major banks dictionary,
    otherwise returns a generic bank name if the routing number is valid.
    """
    if not validate_aba_routing(routing_number):
        raise ValueError("Invalid routing number checksum")
        
    return MAJOR_US_BANKS_ROUTING.get(routing_number, "Valid U.S. Financial Institution")

CANADIAN_INSTITUTION_CODES = {
    "001": "Bank of Montreal (BMO)",
    "002": "Bank of Nova Scotia (Scotiabank)",
    "003": "Royal Bank of Canada (RBC)",
    "004": "Toronto-Dominion Bank (TD)",
    "006": "National Bank of Canada",
    "010": "Canadian Imperial Bank of Commerce (CIBC)",
    "016": "HSBC Bank Canada",
    "030": "Canadian Western Bank",
    "039": "Laurentian Bank of Canada",
    "177": "First Nations Bank of Canada",
    "219": "State Street Canada",
    "269": "Mega International Commercial Bank Canada",
    "270": "JPMorgan Chase Bank, N.A. (Canada)",
    "277": "Industrial and Commercial Bank of China (Canada)",
    "290": "State Bank of India (Canada)",
    "308": "Tangerine Bank",
    "310": "Shinhan Bank Canada",
    "315": "CTBC Bank of Canada",
    "320": "President's Choice Bank",
    "328": "Amex Bank of Canada",
    "338": "Tapestry Saving",
    "340": "ICICI Bank Canada",
    "509": "Canada Trust Company",
    "540": "Manulife Bank of Canada",
    "614": "EQ Bank (Equitable Bank)",
    "623": "Wealthsimple Investments",
    "701": "Habib Canadian Bank",
    "809": "Central 1 Credit Union",
    "815": "Fédération des caisses Desjardins du Québec",
    "819": "Caisses populaires de l'Ontario",
    "828": "Meridian Credit Union",
    "839": "Vancity Credit Union",
    "849": "First West Credit Union",
    "879": "ATB Financial (Alberta Treasury Branches)",
    "889": "Coast Capital Savings Federal Credit Union",
    "899": "Conexus Credit Union"
}

def lookup_canadian_bank(routing_number: str) -> str:
    """
    Decodes the 3-digit institution code from a Canadian routing transit number (8 or 9 digits).
    Standard formats:
      - 9 digits: 0YYYXXXXX (0 + 3-digit institution + 5-digit transit)
      - 8 digits: XXXXXYYY (5-digit transit + 3-digit institution)
    """
    if not routing_number or not routing_number.isdigit() or len(routing_number) not in [8, 9]:
        return None
        
    if len(routing_number) == 9 and routing_number.startswith("0"):
        inst_code = routing_number[1:4]
    else:
        inst_code = routing_number[-3:]
        
    return CANADIAN_INSTITUTION_CODES.get(inst_code)
