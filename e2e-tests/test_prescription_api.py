#!/usr/bin/env python3
import requests
import json
import sys

# Test the prescription API with patient data
base_url = "http://localhost:8000/api/v1"

# Login
login_data = {
    "username": "demo",
    "password": "demo123"
}

try:
    login_response = requests.post(f"{base_url}/auth/login", json=login_data)
    if login_response.status_code != 200:
        print(f"Login failed: {login_response.status_code} - {login_response.text}")
        sys.exit(1)
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get prescriptions
    prescriptions_response = requests.get(f"{base_url}/prescriptions/?limit=20&offset=0", headers=headers)
    if prescriptions_response.status_code != 200:
        print(f"Prescriptions request failed: {prescriptions_response.status_code} - {prescriptions_response.text}")
        sys.exit(1)
    
    data = prescriptions_response.json()
    print(f"Found {len(data.get('items', []))} prescriptions")
    
    # Check if patient data is included
    for i, prescription in enumerate(data.get('items', [])):
        print(f"\nPrescription {i+1}:")
        print(f"  ID: {prescription.get('id')}")
        print(f"  Number: {prescription.get('prescription_number')}")
        print(f"  Patient ID: {prescription.get('patient_id')}")
        
        patient = prescription.get('patient')
        if patient:
            print(f"  Patient Data: YES")
            print(f"    Name: {patient.get('first_name', '')} {patient.get('last_name', '')}")
            print(f"    Full Name: {patient.get('full_name', 'N/A')}")
        else:
            print(f"  Patient Data: NO - Still missing!")
            
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)