from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def get_admin_user(token: str = Depends(oauth2_scheme)):
    """
    Verify that the current user is an admin.
    This is a simplified version - in production, you would use proper authentication.
    """
    # In a real application, you would verify the token and check if the user is an admin
    # For now, we'll just return a dummy admin user
    return {"id": "admin", "role": "admin"}