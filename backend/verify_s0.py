import sys
from fastapi.testclient import TestClient
from backend.main import app

def verify_sprint_0():
    print("Starting Sprint 0 Verification...\n")
    
    try:
        with TestClient(app) as client:
            # 1. Verify Health & DB
            print("1. Verifying Health Endpoint & DB Connection...")
            try:
                response = client.get("/api/v1/healthz")
                if response.status_code == 200:
                    data = response.json()
                    if data.get("status") == "ok" and data.get("db_status") == "connected":
                        print("✅ Health check passed: DB connected.")
                    else:
                        print(f"❌ Health check logic failed: {data}")
                        return False
                else:
                    print(f"❌ Health check endpoint failed: Status {response.status_code}, Body: {response.text}")
                    return False
            except Exception as e:
                print(f"❌ Exception during health check: {e}")
                return False

            # 2. Verify CORS
            print("\n2. Verifying CORS Configuration...")
            origin = "http://localhost:5173"
            headers = {
                "Origin": origin,
                "Access-Control-Request-Method": "GET",
            }
            try:
                # Send OPTIONS request for preflight
                response = client.options("/api/v1/healthz", headers=headers)
                if response.status_code == 200:
                    allow_origin = response.headers.get("access-control-allow-origin")
                    if allow_origin == origin:
                         print(f"✅ CORS verified for {origin}")
                    else:
                         print(f"❌ CORS Origin header mismatch. Expected {origin}, got {allow_origin}")
                         return False
                else:
                     print(f"❌ CORS Preflight request failed with status {response.status_code}")
                     return False
            except Exception as e:
                 print(f"❌ Exception during CORS check: {e}")
                 return False
                 
        print("\n✅ Sprint 0 Verification SUCCESS!")
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize TestClient or App: {e}")
        return False

if __name__ == "__main__":
    success = verify_sprint_0()
    if not success:
        sys.exit(1)