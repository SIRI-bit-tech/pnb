import random
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.models.transaction import Transaction, TransactionType, TransactionStatus
from app.models.user import User, Account, CurrencyType
from app.services.ably_service import ably_service
import logging

logger = logging.getLogger(__name__)

# Real human names for P2P transactions
REAL_PEOPLE = [
    {"name": "James R. Miller", "username": "jmiller"},
    {"name": "David K. Anderson", "username": "danderson"},
    {"name": "Marcus Vance", "username": "mvance"},
    {"name": "Michael Chang", "username": "mchang"},
    {"name": "Robert Sterling", "username": "rsterling"},
    {"name": "William B. Cooper", "username": "wcooper"},
    {"name": "Thomas Gallagher", "username": "tgallagher"},
    {"name": "Richard Vance", "username": "rvance"},
    {"name": "Daniel Thorne", "username": "dthorne"},
    {"name": "Gregory Powell", "username": "gpowell"},
    {"name": "Alexander Hayes", "username": "ahayes"},
    {"name": "Jonathan Reed", "username": "jreed"},
    {"name": "Christopher Vance", "username": "cvance"},
    {"name": "Andrew Coleman", "username": "acoleman"},
    {"name": "Edward Walsh", "username": "ewalsh"},
    {"name": "Brian Mitchell", "username": "bmitchell"}
]

# Major architecture, warehouse logistics development, structural steel, precast & international EPC contractors (US, Turkey, Europe)
WAREHOUSE_CONSTRUCTION_DEBIT_VENDORS = [
    # Turkey Top International EPC & Industrial Steel Contractors
    {
        "name": "Enka Insaat ve Sanayi A.S.",
        "memos": [
            "INTL WIRE: Subcontractor Progress Settlement - Industrial Warehouse Structural Frame",
            "SWIFT WIRE: Enka Insaat Istanbul - Steel Superstructure & Heavy Framing Draw #4",
            "Contract #ENK-8810: Logistics Facility Earthworks & Foundation Pour Draw",
            "Enka Global EPC - High-Bay Distribution Terminal Milestone Disbursement"
        ],
        "type": TransactionType.WIRE,
        "bank": "Turkiye Is Bankasi A.S. Istanbul / New York"
    },
    {
        "name": "Ronesans Holding / Renaissance Construction",
        "memos": [
            "SWIFT WIRE: Ronesans Holding Ankara - Industrial Logistics Hub Structural Package",
            "CROSS-BORDER WIRE: Warehouse Tilt-Up Concrete & Roof Envelope Assembly Inv #RH-4402",
            "Ronesans Industrial EPC - Precast Logistics Terminal Construction Settlement",
            "Contract RNS-9102: Multi-Bay Logistics Center Superstructure Draw"
        ],
        "type": TransactionType.WIRE,
        "bank": "Garanti BBVA Istanbul / New York Branch"
    },
    {
        "name": "Tekfen Construction & Installation Co.",
        "memos": [
            "INTL WIRE: Tekfen Insaat Istanbul - Heavy Structural Steel Fabrication Deposit",
            "SWIFT WIRE: Logistics Center Automated Racking Structural Embeds & Joists",
            "Tekfen Industrial - Substation & Warehouse High-Clearance Steel Erection Pmt",
            "Contract TKF-3320: Pre-Engineered Warehouse Structural Bay Framing Draw"
        ],
        "type": TransactionType.WIRE,
        "bank": "Akbank T.A.S. Istanbul / New York"
    },
    {
        "name": "Limak Holding Industrial Projects",
        "memos": [
            "CROSS-BORDER WIRE: Limak Insaat Ankara - Concrete Batching & Superflat Floor Slab Pour",
            "SWIFT PMT: Regional Freight Terminal Earthworks & Heavy Paving Settlement",
            "Limak Infrastructure - Automated Fulfillment Facility Site Civil Draw #7"
        ],
        "type": TransactionType.WIRE,
        "bank": "Turkiye Vakiflar Bankasi Istanbul / NY"
    },
    # International Architecture & Engineering Firms (Europe, UK, Canada, Australia)
    {
        "name": "Arcadis NV Global Design",
        "memos": [
            "CROSS-BORDER WIRE: Logistics Hub Structural Modeling & Masterplan #ARC-9021",
            "INV-ARC-9021 Logistics Park Architectural Blueprinting Phase 2",
            "Arcadis Industrial Facility Civil & Environmental Engineering Settlement",
            "International Distribution Center Structural Feasibility Study"
        ],
        "type": TransactionType.WIRE,
        "bank": "ING Bank N.V. Amsterdam / New York"
    },
    {
        "name": "Arup Group International Engineering",
        "memos": [
            "SWIFT WIRE: Industrial Warehouse Foundation & Geotechnical Survey Ref #AR-7712",
            "Arup High-Bay Distribution Structural Engineering Peer Review",
            "Warehouse Automated Storage & Retrieval (ASRS) Structural Design Settlement",
            "Arup London / NY Building Envelope & Facade Engineering Progress Draw"
        ],
        "type": TransactionType.WIRE,
        "bank": "Barclays Bank PLC London / New York"
    },
    {
        "name": "Gensler Architectural Services",
        "memos": [
            "PO-GEN-4410 Logistics Campus Architectural Design Phase 2",
            "Warehouse Office Annex Concept Schematics & Permitting Set",
            "Gensler Architectural Construction Documentation & BIM Modeling",
            "Distribution Facility Master Site Planning & Municipal Zoning Review"
        ],
        "type": TransactionType.ACH,
        "bank": "JPMorgan Chase Bank, N.A."
    },
    {
        "name": "WSP Global Engineering & Infrastructure",
        "memos": [
            "INTERNATIONAL WIRE: Industrial Warehouse Pre-Cast Concrete Design Review",
            "WSP Montreal / NY Facility Stormwater Retention & Site Civil Engineering",
            "Contract #WSP-3390: Logistics Park Structural Floor Slab Loading Analysis",
            "Regional Distribution Center Building Systems & Mechanical Engineering"
        ],
        "type": TransactionType.WIRE,
        "bank": "Royal Bank of Canada / New York Branch"
    },
    # US Warehouse Systems, Structural Steel & Materials Suppliers
    {
        "name": "Butler Manufacturing / BlueScope Steel",
        "memos": [
            "PO-BTL-8941 Pre-Engineered Steel Building System for 250,000 sq ft Facility",
            "Heavy Structural Steel Rigid Frames & Heavy Truss Shipments",
            "Butler MR-24 Standing Seam Warehouse Roof System Fabrication Deposit",
            "CROSS-BORDER WIRE: BlueScope Australia / US Structural Steel Supply Settlement"
        ],
        "type": TransactionType.WIRE,
        "bank": "ANZ Banking Group / New York"
    },
    {
        "name": "Prologis Logistics Development Supply",
        "memos": [
            "INV-PLD-5502 Industrial Warehouse Hydraulic Dock Levelers & Pit Systems",
            "High-Speed Insulated Overhead Sectional Doors Procurement",
            "Distribution Center Concrete Tilt-Up Panel Hardware & Embeds",
            "Logistics Warehouse Superflat Concrete Floor Joint Systems"
        ],
        "type": TransactionType.ACH,
        "bank": "Bank of America, N.A."
    },
    {
        "name": "Nucor Building Systems / Vulcraft",
        "memos": [
            "INV-NUC-6712 Structural Steel Joists & Metal Decking for Warehouse Expansion",
            "Vulcraft Heavy Steel Joist Girders for Distribution Center 40ft Clear",
            "Nucor Warehouse Cold-Formed Steel Purlins & Girts Delivery Settlement"
        ],
        "type": TransactionType.ACH,
        "bank": "Wells Fargo Bank, N.A."
    },
    {
        "name": "Cemex Materials International",
        "memos": [
            "INV-CMX-9930 Fiber-Reinforced Ready-Mix Concrete for Heavy Industrial Slabs",
            "Tilt-Wall Concrete Panel Castings & Laser Screed Placement Settlement",
            "CROSS-BORDER WIRE: Cemex Materials S.A.B. de C.V. Industrial Aggregates"
        ],
        "type": TransactionType.WIRE,
        "bank": "BBVA Mexico / New York Branch"
    },
    {
        "name": "Vinci Construction Grands Projets",
        "memos": [
            "EURO WIRE: Vinci International Warehouse Civil Earthworks & Foundation Contract",
            "Vinci Industrial Building Envelope Fabrication Milestone Payment",
            "Contract VC-1049: Automated Logistics Center Structural Skeleton Assembly"
        ],
        "type": TransactionType.WIRE,
        "bank": "Société Générale Paris / New York"
    },
    {
        "name": "Hochtief AG / Turner Construction",
        "memos": [
            "INTL WIRE: Hochtief Essen / Turner Warehouse EPC Progress Draw #8",
            "Distribution Complex General Contracting Progress Payment (AIA G702)",
            "Logistics Warehouse Superstructure Subcontractor Settlement PO #HT-882"
        ],
        "type": TransactionType.WIRE,
        "bank": "Commerzbank AG Frankfurt / New York"
    },
    {
        "name": "Autodesk & Bentley Systems Architecture",
        "memos": [
            "INV-ADSK-8041 Revit AEC Collection Enterprise BIM Licenses",
            "Bentley MicroStation & OpenBuildings Structural Engineering Suite",
            "Trimble Tekla Structures 3D Steel Detailing & Warehouse Modeling Software"
        ],
        "type": TransactionType.ACH,
        "bank": "Silicon Valley Bank / First Citizens"
    }
]

# Electrical engineering, substation, and power equipment suppliers (US & International)
ELECTRICAL_DEBIT_VENDORS = [
    {
        "name": "Siemens Energy AG",
        "memos": [
            "INV-SE7491 HV Step-Down Transformer Coils & Bushings",
            "INV-SE8812 Power Transmission Relay & Circuit Assemblies",
            "Procurement: 138kV Substation Switchgear Hardware",
            "Siemens Energy Grid Tech Parts & Testing Units",
            "EUR-WIRE Settlement: Siemens Erlangen High-Voltage Testing Lab"
        ],
        "type": TransactionType.WIRE,
        "bank": "Deutsche Bank AG Frankfurt / NY Branch"
    },
    {
        "name": "Schneider Electric Industries SAS",
        "memos": [
            "PO-SE-6630 Medium Voltage Gas-Insulated Switchgear",
            "Schneider EcoStruxure Substation Automation Hardware",
            "Tripping Relays & Instrument Transformers Inv #4920",
            "Schneider Electric Industrial Busway Distribution Systems",
            "Square D 480V 2000A Switchboard & Panelboard Feeder Order",
            "INTL WIRE: Schneider Electric Rueil-Malmaison Facility Automation"
        ],
        "type": TransactionType.WIRE,
        "bank": "BNP Paribas Paris / New York"
    },
    {
        "name": "ABB Electrification Sweden / Zurich",
        "memos": [
            "PO-ABB-8831 ReliaGear LV Switchboards & Breakers",
            "ABB Tmax XT Molded Case Circuit Breakers & Trip Units",
            "Facility ATS Automatic Transfer Switch 1200A 480V",
            "ABB Industrial Variable Frequency Drives & Softstarters",
            "SWIFT WIRE: ABB Electrification Sweden AB Heavy Switchgear Order"
        ],
        "type": TransactionType.WIRE,
        "bank": "UBS Switzerland AG / Zurich"
    },
    {
        "name": "Hitachi Energy USA Inc",
        "memos": [
            "INV-HE-9041 SF6-Free High Voltage Circuit Breakers",
            "Hitachi Power Grids Microgrid Automation Controller",
            "Contract H-8820: Substation Transformer Core Assemblies",
            "Hitachi Energy TrafoStar Power Transformer Accessories"
        ],
        "type": TransactionType.WIRE,
        "bank": "JPMorgan Chase Bank, N.A."
    },
    {
        "name": "Eaton Power Systems",
        "memos": [
            "PO-EAT-1092 Three-Phase Pad-Mounted Transformers 1500kVA",
            "Eaton Cooper Power Systems Vacuum Fault Interrupters",
            "Substation Surge Arresters & Transformer Tap Changers",
            "Pow-R-Line Distribution Panelboards & Feeders",
            "Cutler-Hammer Industrial Motor Starters & Drives"
        ],
        "type": TransactionType.ACH,
        "bank": "PNC Bank, N.A."
    },
    {
        "name": "Graybar Electric Supply",
        "memos": [
            "Graybar Industrial Building Electrical Rough-In Supplies",
            "INV-GB-4421 600V Copper Feeders & NEMA 3R Enclosures",
            "High-Bay LED Warehouse Lighting & Control Gear",
            "Distribution Switchboard Replacement Components"
        ],
        "type": TransactionType.ACH,
        "bank": "Bank of America, N.A."
    },
    {
        "name": "Southwire Company LLC",
        "memos": [
            "Southwire SIMpull THHN Feeder Cable Requisite",
            "INV-SW-8022 Bare Copper Ground Wire & Mechanical Lugs",
            "Direct Burial Armored Feeder Cable MC-HL 500 kcmil"
        ],
        "type": TransactionType.ACH,
        "bank": "Truist Bank"
    }
]

# Telecom (low price AT&T bills)
TELECOM_DEBIT_VENDORS = [
    {
        "name": "AT&T Mobility Business",
        "memos": [
            "AT&T Substation SCADA Cellular Telemetry #9081",
            "AT&T Wireless Primary Field Terminal Uplink",
            "AT&T Business Smart Grid Connectivity Plan"
        ],
        "type": TransactionType.ACH,
        "bank": "JPMorgan Chase Bank, N.A.",
        "min": 115.00,
        "max": 240.00
    },
    {
        "name": "AT&T Business Telecommunications",
        "memos": [
            "AT&T Substation Dedicated Fiber Line Interconnect",
            "AT&T Ethernet Virtual Private Network Circuit",
            "AT&T High-Reliability Power Grid Communication Line"
        ],
        "type": TransactionType.ACH,
        "bank": "Citibank, N.A.",
        "min": 185.00,
        "max": 395.00
    }
]

# Major Energy Utilities & Power Infrastructure Clients (Credits)
ENERGY_CREDIT_VENDORS = [
    {
        "name": "Duke Energy Corporation",
        "memos": [
            "ACH DIRECT DISBURSEMENT: Substation Engineering Settlement",
            "VENDOR PMT: 230kV Transformer Replacement Milestone 2",
            "Duke Energy Carolinas Transmission Project Contract Pmt",
            "ENGINEERING DISBURSEMENT: Substation Protection Study"
        ],
        "type": TransactionType.ACH,
        "bank": "Wells Fargo Bank, N.A."
    },
    {
        "name": "NextEra Energy Global Procurement",
        "memos": [
            "FED WIRE DIRECT CREDIT: Utility Solar Grid Interconnection Pmt",
            "NextEra Energy Grid Modernization Progress Billing #4",
            "CONTRACT PMT: High Voltage Transformer Testing & Commissioning",
            "NextEra Power Infrastructure Engineering Final Settlement"
        ],
        "type": TransactionType.WIRE,
        "bank": "JPMorgan Chase Bank, N.A."
    },
    {
        "name": "Southern Company Services",
        "memos": [
            "ACH PMT: Georgia Power Substation Relay Upgrade Contract",
            "Southern Company Transmission Line Construction Milestone",
            "DIRECT CREDIT: High Voltage Transformer Diagnostic Assessment",
            "Vendor Payment: Power Grid Protection System Consulting"
        ],
        "type": TransactionType.ACH,
        "bank": "Regions Bank"
    },
    {
        "name": "Dominion Energy Infrastructure",
        "memos": [
            "WIRE CREDIT: 500kV Substation Expansion Project Settlement",
            "Dominion Energy Engineering & Transformer Overhaul Pmt",
            "PROGRESS BILLING: Power Grid Interconnection Relay Package",
            "Dominion Energy Electric Transmission Contract Disbursement"
        ],
        "type": TransactionType.WIRE,
        "bank": "Bank of America, N.A."
    },
    {
        "name": "Consolidated Edison Transmission",
        "memos": [
            "ACH CREDIT: ConEd Substation High Voltage Switchgear Phase 1",
            "ConEdison NY Electric Grid Reliability Project Payment",
            "ENGINEERING VENDOR DISBURSEMENT: Transformer Refurbishment",
            "ConEd Energy Transmission Substation SCADA Commissioning"
        ],
        "type": TransactionType.ACH,
        "bank": "The Bank of New York Mellon"
    },
    {
        "name": "Bechtel Power Infrastructure",
        "memos": [
            "FED WIRE PMT: Power Station Grid Step-Up Engineering Milestone",
            "Bechtel Infrastructure Major Substation Procurement Pmt",
            "CONTRACT SETTLEMENT: High Voltage Substation Cabling & Design",
            "Bechtel EPC Power Division Vendor Disbursement"
        ],
        "type": TransactionType.WIRE,
        "bank": "Citibank, N.A."
    },
    {
        "name": "Fluor Corporation Power Division",
        "memos": [
            "ACH SETTLEMENT: Regional Substation Transformer Commissioning",
            "Fluor Power Grid Infrastructure Electrical Engineering Pmt",
            "CONTRACT DISBURSEMENT: 115kV Transmission Line Testing",
            "Fluor Corp Substation Switchgear Technical Integration"
        ],
        "type": TransactionType.ACH,
        "bank": "JPMorgan Chase Bank, N.A."
    },
    {
        "name": "Treasury Direct / US Dept of Energy",
        "memos": [
            "TREASURY DIRECT ACH: Grid Resilience Infrastructure Grant Pmt",
            "US DOE FED DISBURSEMENT: Clean Energy Grid Modernization Fund",
            "FEDERAL TREASURY PMT: Regional Power Transmission Initiative",
            "US TREAS 303: Electrical Grid Infrastructure Allocation"
        ],
        "type": TransactionType.ACH,
        "bank": "Federal Reserve Bank of New York"
    },
    {
        "name": "Prologis Development Trust",
        "memos": [
            "FED WIRE PMT: Gateway Logistics Park Phase 3 Architectural Contract (AIA G702)",
            "Prologis Master Architectural & Civil Planning Milestone Draw #4",
            "VENDOR SETTLEMENT: 500,000 sq ft Regional Fulfillment Center Engineering",
            "ACH CREDIT: Prologis Automated Logistics Hub Progress Payment #6"
        ],
        "type": TransactionType.WIRE,
        "bank": "JPMorgan Chase Bank, N.A."
    },
    {
        "name": "Goodman Group Logistics Global",
        "memos": [
            "INTERNATIONAL WIRE: Goodman Global High-Bay Logistics Hub Engineering Milestone",
            "Goodman Logistics Center Master Development Fee Draw",
            "SWIFT CREDIT: Sydney/NY Distribution Campus Architectural Masterplan Draw",
            "CONTRACT PMT: Multi-Story E-Commerce Logistics Facility Design Review"
        ],
        "type": TransactionType.WIRE,
        "bank": "HSBC Bank USA / Sydney"
    },
    {
        "name": "Enka Insaat ve Sanayi A.S.",
        "memos": [
            "SWIFT WIRE CREDIT: Istanbul Logistics Hub Master Design & Peer Review Milestone",
            "Enka Global EPC - Engineering Consultant Disbursement (Phase 2)",
            "INTERNATIONAL WIRE: Structural Steel Detailing & Foundation Design Fee Settlement"
        ],
        "type": TransactionType.WIRE,
        "bank": "Turkiye Is Bankasi A.S. Istanbul / New York"
    },
    {
        "name": "Turner Construction Company",
        "memos": [
            "ACH CREDIT: Turner Project #8812 - Architect Progress Draw #7",
            "PROGRESS PMT: Regional Distribution Center Engineering Oversight",
            "Turner Construction Subcontract Draw: Structural Observation & MEP Review",
            "VENDOR SETTLEMENT: Logistics Center Foundation & Shell Inspection"
        ],
        "type": TransactionType.ACH,
        "bank": "JPMorgan Chase Bank, N.A."
    },
    {
        "name": "Skanska USA Building Inc",
        "memos": [
            "FED WIRE PMT: Industrial Campus Engineering Milestone Draw #5",
            "Skanska Distribution Campus Power Distribution Final Disbursement",
            "CONTRACT PMT: Emergency Generator & Switchgear Paralleling Commissioning"
        ],
        "type": TransactionType.WIRE,
        "bank": "Citibank, N.A."
    },
    {
        "name": "Brookfield Properties Logistics",
        "memos": [
            "ACH CREDIT: Brookfield Industrial Logistics Portfolio Architectural Consulting",
            "Brookfield Logistics Center Cold-Storage Expansion Engineering Pmt",
            "VENDOR DISBURSEMENT: Logistics Park Civil & Stormwater Coordination"
        ],
        "type": TransactionType.ACH,
        "bank": "The Bank of New York Mellon"
    },
    {
        "name": "Hines Industrial Development",
        "memos": [
            "FED WIRE PMT: Hines Logistics Center Schematic Design Phase Draw",
            "Industrial Logistics Park Architectural Contract Final Draw",
            "CONTRACT PMT: Warehouse Site Pre-Development Planning Settlement"
        ],
        "type": TransactionType.WIRE,
        "bank": "Citibank, N.A."
    },
    {
        "name": "CBRE Project Management",
        "memos": [
            "ACH DIRECT DISBURSEMENT: Industrial Facility Structural Audit & Feasibility",
            "CBRE Project Management: Switchboard Modernization Settlement",
            "VENDOR PMT: Logistics Center Building Energy Management Upgrade"
        ],
        "type": TransactionType.ACH,
        "bank": "Bank of America, N.A."
    }
]

def parse_date_safely(date_val: Any) -> Optional[datetime]:
    if not date_val:
        return None
    s = str(date_val).strip()
    for fmt in (
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%m-%d-%Y",
        "%d-%m-%Y",
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
    ):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            continue
    return None


class TransactionGeneratorService:
    @staticmethod
    async def generate_history_for_user(
        db: AsyncSession,
        user: User,
        starting_balance: Decimal,
        closing_balance: Decimal,
        days: int = 60,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        split_ratio: Decimal = Decimal("0.50"),
        transaction_count: int = 25
    ) -> Dict[str, Any]:
        """
        Generates a mathematically reconciled stream of transactions spanning historical start_date to end_date.
        Supports 1 to 1000 transactions across:
        - Commercial Architecture & Warehouse Development debits (International & US EPC)
        - Commercial Electrical Engineering, Power Grid & Switchgear debits
        - IRS / Tax (Refund credits, tax payment debits)
        - Loans (Disbursement credits, autopay debits)
        - P2P (Received credits and sent debits with real human names)
        - Cards (Virtual card online/POS debits for engineering & architectural supplies)
        - Deposits (Mobile check, PayPal, Cash App, wire, ACH)
        - AT&T Telecom debits
        - Major Energy Utility, Logistics REIT & Commercial Warehouse client credits
        Reconciles exactly so starting_balance + sum(credits) - sum(debits) = closing_balance.
        Tops up user account split into checking and savings.
        """
        account_query = await db.execute(select(Account).filter(Account.user_id == user.id))
        account = account_query.scalars().first()
        if not account:
            raise ValueError(f"No account record found for user {user.email}")

        # Clamp transaction count between 1 and 1000
        num_tx = max(1, min(1000, transaction_count))
        net_delta = closing_balance - starting_balance

        now = datetime.now(timezone.utc)

        parsed_end = parse_date_safely(end_date)
        if parsed_end:
            end_time = parsed_end.replace(
                tzinfo=timezone.utc,
                hour=16,
                minute=random.randint(15, 45),
                second=random.randint(10, 50)
            )
        else:
            end_time = now

        parsed_start = parse_date_safely(start_date)
        if parsed_start:
            start_time = parsed_start.replace(
                tzinfo=timezone.utc,
                hour=9,
                minute=random.randint(15, 45),
                second=random.randint(10, 50)
            )
        else:
            start_time = end_time - timedelta(days=days or 60)

        if end_time <= start_time:
            end_time = start_time + timedelta(days=1, hours=7)

        total_span_seconds = max(120, int((end_time - start_time).total_seconds()))

        # Generate timestamps spread naturally and strictly sequentially
        # Hard mathematical constraint: timestamps strictly between start_time and end_time
        # Absolutely NO timestamp can EVER exceed end_time.
        if num_tx == 1:
            timestamps = [end_time]
        else:
            raw_weights = [random.uniform(0.6, 1.4) for _ in range(num_tx - 1)]
            sum_weights = sum(raw_weights)

            cum_fractions = [0.0]
            running_w = 0.0
            for w in raw_weights:
                running_w += w
                cum_fractions.append(min(1.0, running_w / sum_weights))
            cum_fractions[-1] = 1.0

            timestamps = []
            for i, f in enumerate(cum_fractions):
                if i == 0:
                    timestamps.append(start_time)
                elif i == len(cum_fractions) - 1:
                    timestamps.append(end_time)
                else:
                    exact_sec = f * total_span_seconds
                    base_dt = start_time + timedelta(seconds=exact_sec)
                    h = random.randint(8, 17)
                    m = random.randint(10, 55)
                    s = random.randint(10, 55)
                    cand = base_dt.replace(hour=h, minute=m, second=s)
                    if cand <= start_time:
                        cand = start_time + timedelta(minutes=random.randint(10, 30))
                    if cand >= end_time:
                        cand = end_time - timedelta(minutes=random.randint(10, 30))
                    timestamps.append(cand)

            timestamps.sort()
            timestamps[0] = start_time
            timestamps[-1] = end_time

            # Ensure minimum separation without pushing past end_time
            for i in range(1, len(timestamps) - 1):
                if timestamps[i] <= timestamps[i - 1]:
                    avail = max(60.0, (end_time - timestamps[i - 1]).total_seconds())
                    remaining = len(timestamps) - i
                    step = max(60, int(avail / (remaining + 1)))
                    timestamps[i] = timestamps[i - 1] + timedelta(seconds=step)

            # Strict upper ceiling enforcement: ensure no timestamp ever exceeds end_time
            timestamps[-1] = end_time
            for i in range(len(timestamps) - 2, 0, -1):
                if timestamps[i] >= timestamps[i + 1]:
                    timestamps[i] = timestamps[i + 1] - timedelta(minutes=random.randint(5, 30))
            timestamps[0] = start_time

        # Handle trivial edge case of 1 transaction
        if num_tx == 1:
            tx_type = TransactionType.ACH if net_delta >= 0 else TransactionType.WIRE
            direction = "credit" if net_delta >= 0 else "debit"
            amt = abs(net_delta)
            if amt == 0:
                amt = Decimal("100.00")
                direction = "credit"
            
            tx = Transaction(
                id=uuid.uuid4(),
                from_account_id=None if direction == "credit" else account.id,
                to_account_id=account.id if direction == "credit" else None,
                type=tx_type,
                amount=amt,
                currency=account.currency or CurrencyType.USD,
                status=TransactionStatus.COMPLETED,
                routing_number=f"0{random.randint(10000000, 99999999)}",
                external_bank_name="Federal Reserve Bank" if direction == "credit" else "ING Bank N.V. / Arcadis Global Design",
                external_account_number=f"•••• {random.randint(1000, 9999)}",
                external_account_name="US Treasury / Energy Infrastructure" if direction == "credit" else "Arcadis NV Global Design",
                fee=Decimal("0.00"),
                memo="Reconciled Ledger Settlement Adjustment - Commercial Project",
                created_at=timestamps[0],
                updated_at=timestamps[0]
            )
            db.add(tx)
            
            checking_portion = round(closing_balance * split_ratio, 2)
            savings_portion = closing_balance - checking_portion
            account.checking_balance = checking_portion
            account.savings_balance = savings_portion
            account.balance = closing_balance
            await db.commit()
            await db.refresh(account)

            return {
                "success": True,
                "message": f"Successfully generated 1 transaction.",
                "user_id": str(user.id),
                "user_email": user.email,
                "user_full_name": user.full_name,
                "transaction_count": 1,
                "starting_balance": float(starting_balance),
                "closing_balance": float(closing_balance),
                "checking_balance": float(account.checking_balance),
                "savings_balance": float(account.savings_balance),
                "total_credits": float(amt) if direction == "credit" else 0.0,
                "total_debits": float(amt) if direction == "debit" else 0.0,
                "net_reconciled_delta": float(net_delta)
            }

        # Multi-transaction generation:
        # Determine number of credits vs debits (roughly 45% credits, 55% debits)
        num_credits = max(1, int(num_tx * 0.45))
        num_debits = num_tx - num_credits

        credit_indices = set(random.sample(range(num_tx), num_credits))
        debit_indices = set(i for i in range(num_tx) if i not in credit_indices)

        # Baseline volume scaling based on balances
        scale = max(Decimal("15000.00"), max(starting_balance, closing_balance) * Decimal("0.85"))
        
        debit_weights = [Decimal(str(round(random.uniform(0.15, 1.0), 4))) for _ in range(num_debits)]
        credit_weights = [Decimal(str(round(random.uniform(0.35, 1.25), 4))) for _ in range(num_credits)]
        
        sum_debit_weights = sum(debit_weights)
        sum_credit_weights = sum(credit_weights)

        base_debits = scale * Decimal(str(round(random.uniform(0.70, 1.15), 2)))
        total_credits = base_debits + net_delta

        if total_credits < scale * Decimal("0.40"):
            base_debits += scale * Decimal("0.50")
            total_credits = base_debits + net_delta

        raw_debit_amts = [
            max(Decimal("25.00"), round((w / sum_debit_weights) * base_debits, 2))
            for w in debit_weights
        ]
        raw_credit_amts = [
            max(Decimal("50.00"), round((w / sum_credit_weights) * total_credits, 2))
            for w in credit_weights
        ]

        # Exact mathematical balance reconciliation:
        diff = (sum(raw_credit_amts) - sum(raw_debit_amts)) - net_delta
        raw_credit_amts[-1] -= diff

        debit_amt_iter = iter(raw_debit_amts)
        credit_amt_iter = iter(raw_credit_amts)

        generated_transactions = []

        # Category pools
        for idx, ts in enumerate(timestamps):
            if idx in credit_indices:
                amt = next(credit_amt_iter)
                # Category choices for Credits:
                # 1. Energy Utility, Logistics REIT & Commercial Warehouse Clients (50%)
                # 2. Deposit: Mobile Check, PayPal, Cash App (25%)
                # 3. P2P Received from real person (15%)
                # 4. IRS Tax Refund (5%)
                # 5. Loan Disbursement (5%)
                cat_rand = random.random()

                if cat_rand < 0.50:
                    vendor = random.choice(ENERGY_CREDIT_VENDORS)
                    ext_name = vendor["name"]
                    memo = random.choice(vendor["memos"])
                    tx_type = vendor["type"]
                    bank = vendor["bank"]
                elif cat_rand < 0.75:
                    dep_type = random.choice(["check", "paypal", "cashapp"])
                    if dep_type == "check":
                        ext_name = "Mobile Check Deposit"
                        memo = f"CHECK #{random.randint(10000, 99999)} - Commercial Warehouse Architecture Fee"
                        tx_type = TransactionType.DEPOSIT
                        bank = "Prescott National Bank Mobile Deposit"
                    elif dep_type == "paypal":
                        ext_name = "PayPal Inc."
                        memo = f"PAYPAL TRANSFER INSTANT CASHOUT #{random.randint(100000, 999999)}"
                        tx_type = TransactionType.ACH
                        bank = "Wells Fargo Bank, N.A. / PayPal"
                    else:
                        ext_name = "Cash App / Square Inc"
                        memo = f"CASH APP CASHOUT ID: CA-{random.randint(100000, 999999)}"
                        tx_type = TransactionType.ACH
                        bank = "Lincoln Savings Bank / Cash App"
                elif cat_rand < 0.90:
                    person = random.choice(REAL_PEOPLE)
                    ext_name = person["name"]
                    p2p_memos = [
                        f"P2P Transfer from {person['name']} (@{person['username']})",
                        f"Payment from {person['name']} (Warehouse architectural design milestone)",
                        f"Transfer from {person['name']} - Logistics facility site inspection fee",
                        f"P2P Credit from {person['name']} (MEP coordination & peer review)",
                        f"Payment from {person['name']} (Industrial distribution BIM modeling fee)"
                    ]
                    memo = random.choice(p2p_memos)
                    tx_type = TransactionType.P2P
                    bank = "Prescott National Bank P2P Network"
                elif cat_rand < 0.95:
                    ext_name = "Internal Revenue Service"
                    irs_memos = [
                        "IRS TREAS 310 - FEDERAL TAX REFUND DIRECT DEP",
                        "INTERNAL REVENUE SERVICE - 1040 REFUND",
                        "IRS STATE & LOCAL ENERGY CREDIT REFUND"
                    ]
                    memo = random.choice(irs_memos)
                    tx_type = TransactionType.ACH
                    bank = "Federal Reserve Bank of Richmond"
                else:
                    ext_name = "Prescott National Bank Loan Dept"
                    loan_memos = [
                        f"PRESCOTT NATIONAL BANK FACILITY LOAN PROCEEDS #LN-{random.randint(1000, 9999)}",
                        f"CONSTRUCTION LINE OF CREDIT DRAW #LC-{random.randint(1000, 9999)}",
                        f"PRESCOTT NATIONAL BANK CAPITAL ASSET DISBURSEMENT #LN-{random.randint(1000, 9999)}"
                    ]
                    memo = random.choice(loan_memos)
                    tx_type = TransactionType.ACH
                    bank = "Prescott National Bank"

                tx = Transaction(
                    id=uuid.uuid4(),
                    from_account_id=None,
                    to_account_id=account.id,
                    type=tx_type,
                    amount=amt,
                    currency=account.currency or CurrencyType.USD,
                    status=TransactionStatus.COMPLETED,
                    routing_number=f"0{random.randint(10000000, 99999999)}",
                    external_bank_name=bank,
                    external_account_number=f"•••• {random.randint(1000, 9999)}",
                    external_account_name=ext_name,
                    fee=Decimal("0.00"),
                    memo=memo,
                    created_at=ts,
                    updated_at=ts
                )
                generated_transactions.append((tx, "credit", amt))

            else:
                amt = next(debit_amt_iter)
                # Category choices for Debits:
                # 1. Architecture, Warehouse Developments & International EPC Construction (60%)
                # 2. Electrical Engineering, Substation & Switchgear (15%)
                # 3. Virtual Card Purchases (12%)
                # 4. P2P Sent to field engineers & specialists (7%)
                # 5. AT&T Telecom (3%)
                # 6. Loan Autopay (2%)
                # 7. IRS Tax Payment (1%)
                cat_rand = random.random()

                if cat_rand < 0.60:
                    vendor = random.choice(WAREHOUSE_CONSTRUCTION_DEBIT_VENDORS)
                    ext_name = vendor["name"]
                    memo = random.choice(vendor["memos"])
                    tx_type = vendor["type"]
                    bank = vendor["bank"]
                elif cat_rand < 0.75:
                    vendor = random.choice(ELECTRICAL_DEBIT_VENDORS)
                    ext_name = vendor["name"]
                    memo = random.choice(vendor["memos"])
                    tx_type = vendor["type"]
                    bank = vendor["bank"]
                elif cat_rand < 0.87:
                    card_last4 = random.randint(1000, 9999)
                    card_vendors = [
                        ("Autodesk BIM Subscriptions", f"CARD •••• {card_last4} - Revit AEC Collection 3D Modeling"),
                        ("Bluebeam Revu Software", f"CARD •••• {card_last4} - Revu eXtreme Plan Takeoff & Estimating"),
                        ("Hilti Corporation", f"VIRTUAL CARD •••• {card_last4} - HIT-HY 200 Structural Anchor Systems"),
                        ("Trimble Geospatial", f"VIRTUAL CARD •••• {card_last4} - Total Station Site Surveying Software"),
                        ("Terracon Testing Labs", f"CARD •••• {card_last4} - ASTM Concrete Core Break & Compaction Test"),
                        ("FedEx Office Print", f"CARD •••• {card_last4} - 36x48 Full Architectural Plan Plots (Set of 6)"),
                        ("Grainger Industrial", f"VIRTUAL CARD •••• {card_last4} - Fluke Thermal Imaging & Diagnostic Tools"),
                        ("Graybar Electric Supply", f"CARD •••• {card_last4} - 600V Distribution Rough-In Hardware"),
                        ("Schneider Electric Direct", f"CARD •••• {card_last4} - Square D 480V Panel Components"),
                        ("Siemens Industrial Online", f"VIRTUAL CARD •••• {card_last4} - Substation Relay Spares")
                    ]
                    cv_name, cv_memo = random.choice(card_vendors)
                    ext_name = cv_name
                    memo = cv_memo
                    tx_type = TransactionType.ACH
                    bank = "Visa / Prescott National Bank Virtual Card"
                elif cat_rand < 0.94:
                    person = random.choice(REAL_PEOPLE)
                    ext_name = person["name"]
                    p2p_memos = [
                        f"P2P Sent to {person['name']} (@{person['username']})",
                        f"Transfer to {person['name']} - Warehouse site inspection & compaction report",
                        f"Payment to {person['name']} (Architectural drafting milestone #3)",
                        f"P2P Transfer to {person['name']} - Stormwater drainage calculation fee",
                        f"Payment to {person['name']} (Structural peer review - 36ft clear height)",
                        f"Transfer to {person['name']} - Logistics facility BIM clash detection"
                    ]
                    memo = random.choice(p2p_memos)
                    tx_type = TransactionType.P2P
                    bank = "Prescott National Bank P2P Network"
                elif cat_rand < 0.97:
                    vendor = random.choice(TELECOM_DEBIT_VENDORS)
                    ext_name = vendor["name"]
                    memo = random.choice(vendor["memos"])
                    tx_type = vendor["type"]
                    bank = vendor["bank"]
                elif cat_rand < 0.99:
                    ext_name = "Prescott National Bank Loan Servicing"
                    loan_num = random.randint(1000, 9999)
                    loan_memos = [
                        f"PRESCOTT NATIONAL BANK LOAN AUTOPAY #LN-{loan_num} MONTHLY PMT",
                        f"LINE OF CREDIT AMORTIZATION PRINCIPAL & INT #LC-{loan_num}",
                        f"PRESCOTT NATIONAL BANK EQUIPMENT LEASE PMT #EQ-{loan_num}"
                    ]
                    memo = random.choice(loan_memos)
                    tx_type = TransactionType.ACH
                    bank = "Prescott National Bank"
                else:
                    ext_name = "Internal Revenue Service"
                    irs_memos = [
                        "IRS USATAX PAYMENT - ELECTRONIC 1040 QUARTERLY PMT",
                        "IRS ESTIMATED TAX EFTPS PAYMENT",
                        "INTERNAL REVENUE SERVICE - BUSINESS EXCISE PAYMENT"
                    ]
                    memo = random.choice(irs_memos)
                    tx_type = TransactionType.ACH
                    bank = "Federal Reserve Bank"

                tx = Transaction(
                    id=uuid.uuid4(),
                    from_account_id=account.id,
                    to_account_id=None,
                    type=tx_type,
                    amount=amt,
                    currency=account.currency or CurrencyType.USD,
                    status=TransactionStatus.COMPLETED,
                    routing_number=f"0{random.randint(10000000, 99999999)}",
                    external_bank_name=bank,
                    external_account_number=f"•••• {random.randint(1000, 9999)}",
                    external_account_name=ext_name,
                    fee=Decimal("0.00"),
                    memo=memo,
                    created_at=ts,
                    updated_at=ts
                )
                generated_transactions.append((tx, "debit", amt))

        # Batch insert in chunks for performance
        batch_size = 100
        for i in range(0, len(generated_transactions), batch_size):
            chunk = [tx_obj for tx_obj, _, _ in generated_transactions[i:i + batch_size]]
            db.add_all(chunk)
            await db.flush()

        # Update account balances
        checking_portion = round(closing_balance * split_ratio, 2)
        savings_portion = closing_balance - checking_portion
        
        account.checking_balance = checking_portion
        account.savings_balance = savings_portion
        account.balance = closing_balance

        await db.commit()
        await db.refresh(account)

        try:
            await ably_service.publish_balance_update(
                user_id=str(user.id),
                balance=float(account.balance),
                checking_balance=float(account.checking_balance),
                savings_balance=float(account.savings_balance)
            )
        except Exception as e:
            logger.warning(f"Could not publish Ably balance update: {e}")

        total_credits_sum = sum(amt for _, direction, amt in generated_transactions if direction == "credit")
        total_debits_sum = sum(amt for _, direction, amt in generated_transactions if direction == "debit")

        return {
            "success": True,
            "message": f"Successfully generated {len(generated_transactions)} realistic transactions.",
            "user_id": str(user.id),
            "user_email": user.email,
            "user_full_name": user.full_name,
            "transaction_count": len(generated_transactions),
            "starting_balance": float(starting_balance),
            "closing_balance": float(closing_balance),
            "checking_balance": float(account.checking_balance),
            "savings_balance": float(account.savings_balance),
            "total_credits": float(total_credits_sum),
            "total_debits": float(total_debits_sum),
            "net_reconciled_delta": float(total_credits_sum - total_debits_sum)
        }
