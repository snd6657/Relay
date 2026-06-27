import requests
import time
import json

BASE_URL = "http://localhost:8001/api/v1"

def test():
    print("1. Creating Project...")
    res = requests.post(f"{BASE_URL}/projects/", json={
        "name": "E2E Test Project",
        "description": "Testing the full workflow",
        "icp": {
            "industries": ["Software", "AI"],
            "geographies": ["United States", "Canada"],
            "keywords": ["AI startup", "B2B SaaS"],
            "employee_count_min": 10,
            "employee_count_max": 200
        },
        "personas": [],
        "business_rules": []
    })
    if res.status_code != 201:
        print(f"Failed to create project: {res.text}")
        return
    
    project_id = res.json()["id"]
    print(f"Project created with ID: {project_id}")

    print("3. Triggering Workflow...")
    res = requests.post(f"{BASE_URL}/workflow/{project_id}/run")
    if res.status_code != 202:
        print(f"Failed to trigger workflow: {res.text}")
        return

    print("Workflow started! Polling status...")
    
    while True:
        try:
            status_res = requests.get(f"{BASE_URL}/workflow/status/latest")
            data = status_res.json()
            
            if not data.get("pipeline"):
                print("No pipeline data yet...")
                time.sleep(2)
                continue
                
            pipeline = data["pipeline"]
            
            current_steps = [p for p in pipeline if p["status"] in ["running", "paused", "error"]]
            
            if not current_steps:
                # Check if all done
                if all(p["status"] == "done" for p in pipeline):
                    print("\nWorkflow completed successfully!")
                    break
                else:
                    print(f"Weird state: {json.dumps(pipeline, indent=2)}")
                    time.sleep(2)
                    continue
                    
            current = current_steps[0]
            print(f"\rCurrent Step: {current['id']} | Status: {current['status']} | Progress: {current['progress']}%", end="")
            
            if current["status"] == "error":
                print("\nWorkflow errored out!")
                break
                
            if current["status"] == "paused":
                print("\nWorkflow paused for human approval. Resuming...")
                resume = requests.post(f"{BASE_URL}/workflow/{project_id}/resume", json={"approved": True})
                print(resume.json())
                
        except Exception as e:
            print(f"\nError polling: {e}")
            break
            
        time.sleep(2)

if __name__ == "__main__":
    test()
