import httpx
import jwt
from datetime import datetime, timedelta, UTC
import os

# Configuration
AUTHENTIK_URL = "https://authentik.tekonline.com.au"
MIDDLEWARE_URL = "http://localhost:8000"
POSTGREST_URL = "http://localhost:3000"

async def test_complete_flow():
    async with httpx.AsyncClient() as client:
        # 1. Simulate getting a token from Authentik
        # In production, this would come from the OIDC flow
        test_token = jwt.encode(
            {
                "sub": "test-user-id",
                "email": "test@example.com",
                "iat": datetime.now(UTC),
                "exp": datetime.now(UTC) + timedelta(hours=1)
            },
            "test-secret",  # This is just for testing
            algorithm="HS256"
        )

        # 2. Send token to middleware for transformation
        response = await client.post(
            f"{MIDDLEWARE_URL}/transform-token",
            headers={"Authorization": f"Bearer {test_token}"}
        )
        print("Middleware response:", response.json())
        assert response.status_code == 200
        transformed_token = response.json()["token"]

        # 3. Test the transformed token with Postgrest
        response = await client.get(
            f"{POSTGREST_URL}/jwt_settings",
            headers={
                "Authorization": f"Bearer {transformed_token}",
                "X-User-Role": "authenticated",
                "X-JWT-Aud": "localparts"
            }
        )
        print("Postgrest response:", response.json())
        assert response.status_code == 200

if __name__ == "__main__":
    import asyncio
    asyncio.run(test_complete_flow()) 