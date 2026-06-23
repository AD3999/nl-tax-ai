"""
AES-256-GCM encryption for sensitive PII fields (BSN).

Key: 32 random bytes, base64-encoded, stored in BSN_ENCRYPTION_KEY env var.
Generate with:  python -c "import os,base64; print(base64.b64encode(os.urandom(32)).decode())"

Format stored: base64(nonce[12] + ciphertext + tag[16])
"""
import os
import base64


def _get_key() -> bytes:
    key_b64 = os.environ.get("BSN_ENCRYPTION_KEY", "")
    if not key_b64:
        raise EnvironmentError(
            "BSN_ENCRYPTION_KEY is not set. Generate one with: "
            "python -c \"import os,base64; print(base64.b64encode(os.urandom(32)).decode())\""
        )
    try:
        key = base64.b64decode(key_b64)
    except Exception as exc:
        raise ValueError(f"BSN_ENCRYPTION_KEY is not valid base64: {exc}") from exc
    if len(key) != 32:
        raise ValueError(f"BSN_ENCRYPTION_KEY must decode to exactly 32 bytes, got {len(key)}")
    return key


def encrypt_bsn(plain: str) -> str:
    """Encrypt a plain BSN string. Returns empty string if input is empty."""
    if not plain or not plain.strip():
        return ""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    key = _get_key()
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plain.strip().encode("utf-8"), None)
    return base64.b64encode(nonce + ciphertext).decode("ascii")


def decrypt_bsn(encrypted: str) -> str:
    """Decrypt an encrypted BSN. Returns empty string if input is empty."""
    if not encrypted or not encrypted.strip():
        return ""
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    key = _get_key()
    aesgcm = AESGCM(key)
    raw = base64.b64decode(encrypted.strip())
    nonce, ciphertext = raw[:12], raw[12:]
    return aesgcm.decrypt(nonce, ciphertext, None).decode("utf-8")


def bsn_is_set(encrypted: str) -> bool:
    """True if a BSN has been stored (without decrypting it)."""
    return bool(encrypted and encrypted.strip())
