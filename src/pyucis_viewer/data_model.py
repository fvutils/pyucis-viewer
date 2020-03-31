'''
Created on Mar 28, 2020

@author: ballance
'''
from typing import List
from pyucis_viewer.data_model_listener import DataModelListener

class DataModel(object):
    
    def __init__(self):
        self.listeners : List[DataModelListener] = []
        pass
    
    def add_listener(self, l):
        self.listeners.append(l)
        
    def remove_listener(self, l):
        self.listeners.remove(l)
    
    def load(self, db):
        """Load new UCIS database"""
        
        for l in self.listeners:
            l.data_loaded(db)
        pass