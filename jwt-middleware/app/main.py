from fastapi import FastAPI, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from jose import jwt, jwk
from jose.utils import base64url_decode
import httpx
import os
from typing import Optional
import json
from datetime import datetime, UTC
import logging

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()  # This outputs to stdout/stderr for Docker logs
    ]
)
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

# Add debug logging for httpx
logging.getLogger("httpx").setLevel(logging.DEBUG)

app = FastAPI()

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
POSTGREST_URL = os.getenv("POSTGREST_URL", "http://postgrest:3000")
POSTGREST_JWT_SECRET = os.getenv("PGRST_JWT_SECRET", "reallyreallyreallyreallyverysafesecret")
AUTHENTIK_URL = os.getenv("AUTHENTIK_URL", "https://authentik.tekonline.com.au")
JWKS_URL = f"{AUTHENTIK_URL}/application/o/localparts/jwks/"

# Cache the public key to avoid frequent JWKS requests
public_key_cache = None

def get_public_key(jwks_data):
    """Convert JWKS data to a public key for JWT validation"""
    keys = jwks_data.get('keys', [])
    if not keys:
        raise ValueError("No keys found in JWKS")
    
    key = keys[0]  # Use the first key
    return jwk.construct(key)

async def get_authentik_public_key():
    global public_key_cache
    if public_key_cache is None:
        async with httpx.AsyncClient() as client:
            response = await client.get(JWKS_URL)
            if response.status_code != 200:
                logger.error(f"Failed to fetch JWKS: {response.status_code}")
                raise HTTPException(status_code=500, detail="Failed to fetch JWKS")
            
            jwks = response.json()
            # Get the first key from the JWKS
            key = jwks['keys'][0]
            public_key_cache = jwt.PyJWK(key)
            logger.info("Successfully fetched and cached Authentik public key")
    return public_key_cache

async def transform_token(token: str) -> str:
    global public_key_cache
    try:
        # Get the public key from Authentik's JWKS
        if not public_key_cache:
            async with httpx.AsyncClient() as client:
                response = await client.get(JWKS_URL)
                jwks = response.json()
                public_key_cache = get_public_key(jwks)
                logger.info("Successfully fetched and cached JWKS")

        # Validate the Authentik token
        try:
            decoded = jwt.decode(
                token,
                public_key_cache,
                algorithms=["RS256"],
                audience="localparts"
            )
            logger.info(f"Successfully validated Authentik token for user: {decoded.get('sub')}")
        except Exception as e:
            logger.error(f"Failed to validate Authentik token: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid Authentik token")

        # Create a new token for PostgREST with required claims
        payload = {
            "role": decoded.get("sub"),  # Use the user's ID as the role
            "sub": decoded.get("sub"),  # Keep the original subject
            "email": decoded.get("email"),
            "iat": int(datetime.now(UTC).timestamp()),
            "exp": int(datetime.now(UTC).timestamp() + 3600),
            "aud": "localparts"
        }
        
        logger.info(f"Created PostgREST JWT payload: {json.dumps(payload, indent=2)}")
        
        # Sign with PostgREST secret
        token = jwt.encode(
            payload,
            POSTGREST_JWT_SECRET,
            algorithm="HS256"
        )
        logger.info("Successfully created PostgREST JWT token")
        return token
    except Exception as e:
        logger.error(f"Error during token transformation: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Token transformation failed: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/debug/settings")
async def debug_settings():
    return {
        "postgrest_settings": {
            "url": POSTGREST_URL,
            "jwt_secret": POSTGREST_JWT_SECRET,
            "jwt_aud": "localparts"  # This is what we expect PostgREST to use
        }
    }

@app.get("/debug/jwt")
async def debug_jwt(authorization: Optional[str] = Header(None)):
    response_data = {
        "settings": {
            "postgrest_url": POSTGREST_URL,
            "jwt_secret": POSTGREST_JWT_SECRET,
            "jwt_aud": "localparts"
        }
    }
    
    try:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="No valid authorization header")
            
        token = authorization.split(" ")[1]
        # Transform the actual token
        transformed_token = await transform_token(token)
        
        # Decode it to verify its contents
        decoded = jwt.decode(
            transformed_token,
            POSTGREST_JWT_SECRET,
            algorithms=["HS256"],
            audience="localparts"
        )
        
        response_data.update({
            "debug": {
                "original_token": token,
                "transformed_token": transformed_token,
                "decoded_token": decoded,
                "has_aud": "aud" in decoded,
                "aud_value": decoded.get("aud")
            }
        })
    except Exception as e:
        logger.error(f"Error in debug_jwt: {str(e)}")
        response_data["error"] = str(e)
        response_data["error_type"] = type(e).__name__
        # Add unverified token info for debugging
        try:
            if 'transformed_token' in locals():
                unverified = jwt.decode(transformed_token, POSTGREST_JWT_SECRET, options={"verify_signature": False})
                response_data["unverified_token"] = unverified
        except:
            pass
    
    return response_data

@app.get("/test-connection")
async def test_connection():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(f"{POSTGREST_URL}/")
            logger.info(f"Test connection response: {response.status_code}")
            return {"status": "success", "response": response.json()}
        except Exception as e:
            logger.error(f"Test connection error: {str(e)}")
            return {"status": "error", "message": str(e)}

async def ensure_user_role_exists(user_id: str):
    """Ensure the user's role exists in the database"""
    async with httpx.AsyncClient() as client:
        try:
            # Create a JWT token for the authenticator role
            authenticator_token = jwt.encode(
                {
                    "role": "authenticator",
                    "iat": int(datetime.now(UTC).timestamp()),
                    "exp": int(datetime.now(UTC).timestamp() + 3600),
                    "aud": "localparts"
                },
                POSTGREST_JWT_SECRET,
                algorithm="HS256"
            )
            
            logger.info(f"Attempting to create role for user: {user_id}")
            logger.info(f"Using authenticator token: {authenticator_token}")
            
            # Call the create_user_role function
            response = await client.post(
                f"{POSTGREST_URL}/rpc/create_user_role",
                headers={
                    "Authorization": f"Bearer {authenticator_token}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal"
                },
                json={"user_id": user_id}
            )
            
            logger.info(f"Response status: {response.status_code}")
            logger.info(f"Response headers: {response.headers}")
            logger.info(f"Response body: {response.text}")
            
            # Accept both 200 and 204 as success
            if response.status_code not in [200, 204]:
                logger.error(f"Failed to create user role: {response.text}")
                raise Exception(f"Failed to create user role: {response.text}")
            logger.info(f"Successfully ensured role exists for user: {user_id}")
        except Exception as e:
            logger.error(f"Error ensuring user role exists: {str(e)}")
            raise

@app.post("/runtest")
async def run_test(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No valid authorization header")
    
    token = authorization.split(" ")[1]
    transformed_token = await transform_token(token)
    
    # Decode the transformed token to get the user_id and role
    decoded = jwt.decode(
        transformed_token,
        POSTGREST_JWT_SECRET,
        algorithms=["HS256"],
        audience="localparts"
    )
    user_id = decoded.get("sub")
    role = decoded.get("role", "authenticated")  # Default to "authenticated" if not present
    
    # Ensure the user's role exists
    await ensure_user_role_exists(user_id)
    
    async with httpx.AsyncClient() as client:
        results = {
            "status": "success",
            "passes": [],
            "jwt_info": {
                "original_user_id": user_id,
                "original_role": role
            }
        }
        
        # Define the test users
        test_users = [
            {"user_id": user_id, "role": role, "description": "Original User"},
            {"user_id": "test_user_123", "role": "test_user", "description": "Test User"}
        ]
        
        for test_user in test_users:
            # Create a new token for this test user
            test_token_payload = {
                "sub": test_user["user_id"],
                "role": test_user["role"],
                "aud": "localparts"
            }
            test_token = jwt.encode(
                test_token_payload,
                POSTGREST_JWT_SECRET,
                algorithm="HS256"
            )
            
            headers = {
                "Authorization": f"Bearer {test_token}",
                "X-User-Role": test_user["role"],
                "X-JWT-Aud": "localparts",
                "Prefer": "return=representation"
            }
            
            pass_results = {
                "user_id": test_user["user_id"],
                "role": test_user["role"],
                "description": test_user["description"],
                "steps": []
            }
            
            try:
                # Step 1: Insert a test record
                insert_response = await client.post(
                    f"{POSTGREST_URL}/test",
                    headers=headers,
                    json={
                        "data": f"Test data from {test_user['description']}"
                    }
                )
                pass_results["steps"].append({
                    "operation": "insert",
                    "status": insert_response.status_code,
                    "response": insert_response.json() if insert_response.content else None
                })
                
                if insert_response.status_code != 201:
                    raise Exception(f"Insert failed: {insert_response.text}")
                
                # Get the inserted record's ID
                inserted_id = insert_response.json()[0]["id"]
                
                # Step 2: Fetch all records
                fetch_response = await client.get(
                    f"{POSTGREST_URL}/test",
                    headers=headers
                )
                pass_results["steps"].append({
                    "operation": "fetch",
                    "status": fetch_response.status_code,
                    "response": fetch_response.json() if fetch_response.content else None
                })
                
                # Step 3: Update the record
                update_response = await client.patch(
                    f"{POSTGREST_URL}/test?id=eq.{inserted_id}",
                    headers=headers,
                    json={"data": f"Updated test data from {test_user['description']}"}
                )
                pass_results["steps"].append({
                    "operation": "update",
                    "status": update_response.status_code,
                    "response": update_response.json() if update_response.content else None
                })
                
                # Step 4: Delete the record
                delete_response = await client.delete(
                    f"{POSTGREST_URL}/test?id=eq.{inserted_id}",
                    headers=headers
                )
                pass_results["steps"].append({
                    "operation": "delete",
                    "status": delete_response.status_code,
                    "response": delete_response.json() if delete_response.content else None
                })
                
                # Step 5: Verify deletion
                verify_response = await client.get(
                    f"{POSTGREST_URL}/test?id=eq.{inserted_id}",
                    headers=headers
                )
                pass_results["steps"].append({
                    "operation": "verify_deletion",
                    "status": verify_response.status_code,
                    "response": verify_response.json() if verify_response.content else None
                })
                
            except Exception as e:
                pass_results["status"] = "error"
                pass_results["error"] = str(e)
                logger.error(f"Test failed for user {test_user['user_id']}: {str(e)}")
            
            results["passes"].append(pass_results)
        
        return results

# This should be the last route
@app.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def proxy(path: str, request: Request):
    # Skip proxy for our specific endpoints
    if path in ["health", "debug/settings", "debug/jwt", "test-connection", "runtest"]:
        raise HTTPException(status_code=404, detail="Not found")
        
    try:
        logger.info(f"Received {request.method} request for path: {path}")
        
        # Get headers but exclude host
        headers = {k: v for k, v in request.headers.items() if k.lower() != 'host'}
        logger.info(f"Request headers: {json.dumps(headers, indent=2)}")
        
        # Transform token if present
        if "authorization" in headers:
            token = headers["authorization"].split(" ")[1]
            new_token = await transform_token(token)
            headers["authorization"] = f"Bearer {new_token}"
            
            # Decode the transformed token to get the user_id
            decoded = jwt.decode(
                new_token,
                POSTGREST_JWT_SECRET,
                algorithms=["HS256"],
                audience="localparts"
            )
            user_id = decoded.get("sub")
            
            # Ensure the user's role exists
            await ensure_user_role_exists(user_id)
            
            # Add required headers for PostgREST
            headers.update({
                "X-User-Role": "authenticated",
                "X-JWT-Aud": "localparts",
                "Prefer": "return=representation"
            })
            
            # For POST requests, ensure user_id is included in the body
            if request.method == "POST":
                body = await request.json()
                if isinstance(body, dict):
                    body["user_id"] = user_id
                    request._body = json.dumps(body).encode()
                    headers["content-length"] = str(len(request._body))
            
            logger.info("Token transformed and headers updated successfully")

        # Make request to PostgREST
        async with httpx.AsyncClient() as client:
            logger.info(f"Sending request to: {POSTGREST_URL}/{path}")
            response = await client.request(
                method=request.method,
                url=f"{POSTGREST_URL}/{path}",
                headers=headers,
                content=await request.body()
            )
            logger.info(f"PostgREST response status: {response.status_code}")
            
        return JSONResponse(
            content=response.json() if response.content else None,
            status_code=response.status_code
        )
    except Exception as e:
        logger.error(f"Error in proxy: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}") 