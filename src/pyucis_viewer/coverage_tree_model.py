'''
Created on Mar 29, 2020

@author: ballance
'''
from PyQt5.Qt import QStandardItemModel
from pyucis_viewer.data_model_listener import DataModelListener

class CoverageTreeModel(QStandardItemModel, DataModelListener):
    
    def __init__(self):
        QStandardItemModel.__init__(self)
        self.db = None
        

    def data_loaded(self, db):
        self.clear()
        self.db = db
        
