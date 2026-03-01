import bcrypt
import asyncio

class PasswordManager:
    """
    Password manager using bcrypt
    """
    @staticmethod
    async def hash_password(password: str) -> str:
        """
        Hash a plain-text password asynchronously
        """
        loop = asyncio.get_event_loop()
        salt = bcrypt.gensalt()
        hashed = await loop.run_in_executor(None, bcrypt.hashpw, password.encode(), salt)
        return hashed.decode()

    @staticmethod
    async def verify_password(password: str, hashed_password: str) -> bool:
        """
        Verify a plain-text password against a hashed password asynchronously
        """
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            bcrypt.checkpw,
            password.encode(),
            hashed_password.encode()
        )