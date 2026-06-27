import time
import logging
from app.db.database import SessionLocal
from app.models.project import Project

logger = logging.getLogger(__name__)

def check_pause(config: dict):
    """
    Checks the database to see if the workflow is PAUSED.
    If PAUSED, blocks and sleeps until it is resumed (RUNNING).
    """
    if not config or "configurable" not in config or "thread_id" not in config["configurable"]:
        return

    project_id = config["configurable"]["thread_id"]
    
    while True:
        db = SessionLocal()
        try:
            project = db.query(Project).filter(Project.id == int(project_id)).first()
            if not project:
                break
                
            if project.workflow_status == "PAUSED":
                logger.info(f"Workflow {project_id} is PAUSED. Sleeping...")
                time.sleep(2)
            else:
                break
        except Exception as e:
            logger.error(f"Error checking pause state: {e}")
            break
        finally:
            db.close()
