import jwt
import requests
import json
import uuid
from datetime import datetime, timedelta, UTC

# JWT Configuration from docker-compose.yml
JWT_SECRET = "reallyreallyreallyreallyverysafesecret"
JWT_AUD = "localparts"

# Generate consistent UUIDs for testing
TEST_USER_1_ID = str(uuid.uuid5(uuid.NAMESPACE_DNS, "test-user-1"))
TEST_USER_2_ID = str(uuid.uuid5(uuid.NAMESPACE_DNS, "test-user-2"))

def generate_test_jwt(user_id, email):
    """Generate a test JWT token with required claims"""
    payload = {
        "sub": user_id,  # Subject (user ID)
        "role": "authenticated",  # Role for RLS
        "email": email,
        "iat": datetime.now(UTC),  # Issued at
        "exp": datetime.now(UTC) + timedelta(hours=1),  # Expires in 1 hour
        "aud": JWT_AUD  # Audience
    }
    
    token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
    return token

def test_jwt_settings():
    """Test the JWT settings endpoint"""
    token = generate_test_jwt(TEST_USER_1_ID, "test1@example.com")
    headers = {"Authorization": f"Bearer {token}"}
    
    try:
        response = requests.get("http://localhost:3000/jwt_settings", headers=headers)
        print("\nJWT Settings Response:")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Error testing JWT settings: {e}")
        return False

def create_test_user(user_id, email):
    """Create a test user"""
    token = generate_test_jwt(user_id, email)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    user_data = {
        "id": user_id,
        "email": email,
        "role": "authenticated"
    }
    
    try:
        response = requests.post(
            "http://localhost:3000/users",
            headers=headers,
            json=user_data
        )
        print(f"\nUser Creation Response for {email}:")
        print(json.dumps(response.json(), indent=2))
        return response.status_code in [201, 409]  # 409 means user already exists
    except Exception as e:
        print(f"Error creating user: {e}")
        return False

def test_data_update(user_id, email, data):
    """Test updating data with JWT token"""
    token = generate_test_jwt(user_id, email)
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    
    test_data = {
        "user_id": user_id,
        "data": data
    }
    
    try:
        response = requests.post(
            "http://localhost:3000/test",
            headers=headers,
            json=test_data
        )
        print(f"\nData Update Response for {email}:")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 201
    except Exception as e:
        print(f"Error updating data: {e}")
        return False

def test_data_access(user_id, email):
    """Test accessing data with JWT token"""
    token = generate_test_jwt(user_id, email)
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    try:
        response = requests.get(
            "http://localhost:3000/test",
            headers=headers
        )
        print(f"\nData Access Response for {email}:")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Error accessing data: {e}")
        return False

def test_data_isolation():
    """Test data isolation between users"""
    print("\nTesting Data Isolation...")
    
    # Create two users
    user1_created = create_test_user(TEST_USER_1_ID, "test1@example.com")
    user2_created = create_test_user(TEST_USER_2_ID, "test2@example.com")
    
    if not (user1_created and user2_created):
        print("✗ User creation failed")
        return False
    
    # Post data for each user
    data1_posted = test_data_update(TEST_USER_1_ID, "test1@example.com", "Data from user 1")
    data2_posted = test_data_update(TEST_USER_2_ID, "test2@example.com", "Data from user 2")
    
    if not (data1_posted and data2_posted):
        print("✗ Data posting failed")
        return False
    
    # Try to access data with each user's token
    print("\nTesting data access with user 1's token:")
    access1 = test_data_access(TEST_USER_1_ID, "test1@example.com")
    print("\nTesting data access with user 2's token:")
    access2 = test_data_access(TEST_USER_2_ID, "test2@example.com")
    
    if not (access1 and access2):
        print("✗ Data access failed")
        return False
    
    print("✓ Data isolation test passed")
    return True

def main():
    print("Testing JWT Authentication...")
    print(f"Using test user IDs: {TEST_USER_1_ID}, {TEST_USER_2_ID}")
    
    # Test 1: JWT Settings
    print("\n1. Testing JWT Settings Endpoint")
    if test_jwt_settings():
        print("✓ JWT Settings test passed")
    else:
        print("✗ JWT Settings test failed")
    
    # Test 2: Data Isolation
    if test_data_isolation():
        print("✓ Data isolation test passed")
    else:
        print("✗ Data isolation test failed")

if __name__ == "__main__":
    main() 