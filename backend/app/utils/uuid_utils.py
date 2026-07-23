from uuid import UUID, uuid4


def generate_uuid_bytes() -> bytes:
    return uuid4().bytes


def uuid_to_bytes(value: UUID) -> bytes:
    return value.bytes


def bytes_to_uuid(value: bytes) -> UUID:
    if len(value) != 16:
        raise ValueError("UUID binary value must be 16 bytes")

    return UUID(bytes=value)