'''
Created on Mar 29, 2020

@author: ballance
'''
from PyQt5.Qt import QTreeView

class CoverageDataTree(QTreeView):
    
    def __init__(self, model):
        super().__init__()
        
        self.setModel()