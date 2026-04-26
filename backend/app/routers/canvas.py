from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User, UserRole
from app.models.canvas import CanvasState
from app.dependencies.auth import get_current_user
from sqlalchemy.orm.attributes import flag_modified
from pydantic import BaseModel
from typing import Dict, Any

router = APIRouter()

class CanvasUpdate(BaseModel):
    graph_data: Dict[str, Any]

@router.get("/")
def get_canvas_state(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    state = db.query(CanvasState).first()
    if not state:
        return {"graph_data": {}}
    
    graph_data = state.graph_data
    
    if current_user.role == UserRole.ADMIN:
        return {"graph_data": graph_data}
    
    user_node_id = None
    for node_id, node in graph_data.items():
        node_first_name = node.get('name', '').split(' ')[0].lower()
        if node_first_name == current_user.name.lower():
            user_node_id = node_id
            break
            
    if not user_node_id:
        # Fallback: if user is not found by name, maybe return empty
        return {"graph_data": {}}
        
    if current_user.role == UserRole.EMPLOYEE:
        # IC sees only their own node
        return {"graph_data": {user_node_id: graph_data[user_node_id]}}
        
    # Manager sees subtree
    allowed_nodes = {}
    stack = [user_node_id]
    
    while stack:
        current_id = stack.pop()
        if current_id in graph_data and current_id not in allowed_nodes:
            node = graph_data[current_id]
            allowed_nodes[current_id] = node
            stack.extend(node.get('childrenIds', []))
            
    return {"graph_data": allowed_nodes}

@router.post("/")
def update_canvas_state(update: CanvasUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    state = db.query(CanvasState).first()
    
    if state:
        if current_user.role == UserRole.ADMIN:
            state.graph_data = update.graph_data
        else:
            current_graph = state.graph_data.copy()
            for node_id, node_data in update.graph_data.items():
                current_graph[node_id] = node_data
            state.graph_data = current_graph
            
        state.updated_by = current_user.id
        flag_modified(state, "graph_data")
    else:
        state = CanvasState(graph_data=update.graph_data, updated_by=current_user.id)
        db.add(state)
        
    db.commit()
    return {"status": "success"}
