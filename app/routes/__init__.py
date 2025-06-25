# Routes package initialization
from .conversations import conversations_bp
from .calculators import calculators_bp
from .documents import documents_bp
from .education import education_bp

__all__ = ['conversations_bp', 'calculators_bp', 'documents_bp', 'education_bp'] 