import sys
import uuid
import time

try:
    import requests
except ImportError:
    print("requests module not found. Please run 'pip install requests'")
    sys.exit(1)

BASE_URL = "http://localhost:8000/api/v1"

def wait_for_server(max_retries=5, delay=2):
    print(f"Checking if server is up at {BASE_URL}...")
    for i in range(max_retries):
        try:
            # Try healthz endpoint if it exists, or just the docs/openapi
            # The plan mentions GET /api/v1/healthz
            response = requests.get(f"{BASE_URL}/healthz")
            if response.status_code == 200:
                print("✅ Server is up!")
                return True
        except requests.ConnectionError:
            pass
        
        print(f"Waiting for server... ({i+1}/{max_retries})")
        time.sleep(delay)
    return False

def test_auth_flow():
    if not wait_for_server():
        print("❌ Server is not reachable. Make sure it is running.")
        sys.exit(1)

    # Generate unique email
    email = f"test_{uuid.uuid4()}@example.com"
    password = "strongpassword123"
    
    print(f"\nTesting with email: {email}")
    
    # 1. Signup
    print("\n1. Testing Signup...")
    signup_data = {
        "email": email,
        "password": password,
        "full_name": "Test User"
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/signup", json=signup_data)
        if response.status_code == 201:
            print("✅ Signup successful")
            print(f"Response: {response.json()}")
        else:
            print(f"❌ Signup failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Signup error: {str(e)}")
        sys.exit(1)

    # 2. Login
    print("\n2. Testing Login...")
    login_data = {
        "email": email,
        "password": password
    }
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
        if response.status_code == 200:
            token_data = response.json()
            if "access_token" in token_data:
                print("✅ Login successful")
                access_token = token_data["access_token"]
                print(f"Token received: {access_token[:20]}...")
            else:
                print("❌ Login failed: No access token received")
                sys.exit(1)
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Login error: {str(e)}")
        sys.exit(1)

    # 3. Verify Token (Get /me)
    print("\n3. Testing Token Verification (/me)...")
    headers = {"Authorization": f"Bearer {access_token}"}
    try:
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        if response.status_code == 200:
            user_info = response.json()
            if user_info["email"] == email:
                print("✅ Token verification successful")
                print(f"User: {user_info}")
            else:
                print(f"❌ Token verification failed: Email mismatch ({user_info['email']} != {email})")
                sys.exit(1)
        else:
            print(f"❌ Token verification failed: {response.status_code} - {response.text}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Token verification error: {str(e)}")
        sys.exit(1)

    # 4. Logout
    print("\n4. Testing Logout...")
    try:
        response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
        if response.status_code == 200:
            print("✅ Logout successful")
        else:
            print(f"❌ Logout failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ Logout error: {str(e)}")

if __name__ == "__main__":
    test_auth_flow()