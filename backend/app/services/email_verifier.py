"""
SmartAttend AI / CampusAI - Email Format & Domain MX Verifier

Performs strict multi-layer email verification:
1. Syntax and RFC-compliant format validation
2. Domain extraction and TLD structure validation
3. Real-time DNS MX record resolution via dnspython
4. Disposable and temporary email domain rejection
"""

import re
import dns.resolver
from typing import Tuple, Optional

# Standard RFC 5322 simplified email regex pattern
EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$"
)

# Known disposable/temporary email provider domains to reject immediately
DISPOSABLE_DOMAINS = {
    "mailinator.com",
    "tempmail.com",
    "10minutemail.com",
    "guerrillamail.com",
    "sharklasers.com",
    "throwawaymail.com",
    "trashmail.com",
    "yopmail.com",
    "dispostable.com",
    "temp-mail.org",
    "fakeinbox.com",
}


def validate_email_syntax(email: str) -> Tuple[bool, str]:
    """
    Validates email format strictly.
    Returns (is_valid, error_message).
    """
    if not email or not isinstance(email, str):
        return False, "Email address is required."

    email = email.strip()
    if len(email) > 254:
        return False, "Email address exceeds maximum length of 254 characters."

    if not EMAIL_REGEX.match(email):
        return False, "Invalid email format. Please provide a standard address (e.g. name@college.edu)."

    local_part, domain = email.rsplit("@", 1)
    if len(local_part) > 64:
        return False, "Email local-part exceeds 64 characters."

    if domain.lower() in DISPOSABLE_DOMAINS:
        return False, "Temporary or disposable email domains are not permitted for institutional registration."

    return True, ""


def check_domain_mx(domain: str) -> Tuple[bool, str]:
    """
    Checks whether the email domain exists and has active MX records.
    Returns (has_mx, message).
    """
    domain = domain.strip().lower()

    # Prevent loopback or internal addresses in domain
    if domain in ("localhost", "127.0.0.1", "::1"):
        return False, "Localhost email domains cannot receive external mail."

    resolver = dns.resolver.Resolver()
    resolver.lifetime = 4.0  # 4 second timeout

    try:
        # Check MX records
        answers = resolver.resolve(domain, "MX")
        if answers and len(answers) > 0:
            return True, f"Domain '{domain}' has valid MX records."
    except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
        # Fallback check for A record (RFC 5321 allows mail delivery to A record if MX is absent)
        try:
            a_records = resolver.resolve(domain, "A")
            if a_records and len(a_records) > 0:
                return True, f"Domain '{domain}' has valid A record."
        except Exception:
            return False, f"Domain '{domain}' does not exist or has no active mail servers."
    except dns.resolver.Timeout:
        # Graceful handling if network DNS is slow
        return False, f"DNS resolution for domain '{domain}' timed out. Please check your domain name."
    except Exception as e:
        return False, f"Email domain '{domain}' is invalid or unreachable ({type(e).__name__})."

    return False, f"Domain '{domain}' does not have configured MX records to receive email."


def verify_email_full(email: str) -> Tuple[bool, str, Optional[str]]:
    """
    Complete check: syntax + MX record resolution.
    Returns (is_valid, message, domain).
    """
    is_syntax_valid, syntax_err = validate_email_syntax(email)
    if not is_syntax_valid:
        return False, syntax_err, None

    _, domain = email.strip().rsplit("@", 1)
    has_mx, mx_msg = check_domain_mx(domain)
    if not has_mx:
        return False, f"Email domain validation failed: {mx_msg}", domain

    return True, f"Email address and MX records verified for {domain}.", domain
