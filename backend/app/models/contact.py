from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base

class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("discovered_companies.id"))
    
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, index=True, nullable=True)
    position = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    
    company = relationship("DiscoveredCompany", back_populates="contacts")
