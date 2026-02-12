'''
Created on Mar 29, 2020

@author: ballance
'''
from PyQt5.Qt import QAbstractItemModel, QStandardItemModel, QStandardItem
from pyucis_viewer.data_model_listener import DataModelListener

class InstanceTreeModel(QStandardItemModel, DataModelListener):
    
    def __init__(self):
        QStandardItemModel.__init__(self)
        self.db = None
        
#         root = self.invisibleRootItem()
#         a = QStandardItem("a")
#         root.appendRow(a)
#         b = QStandardItem("b") 
#         a.appendRow(b)
#         c = QStandardItem("c") 
#         b.appendRow(c)
#         
#         self.clear()
#         
#         root = self.invisibleRootItem()
#         a = QStandardItem("d")
#         root.appendRow(a)
#         b = QStandardItem("e") 
#         a.appendRow(b)
#         c = QStandardItem("f") 
#         b.appendRow(c)
        
    
    def data_loaded(self, db):
        self.clear()
        self.db = db
        
        root = self.invisibleRootItem()
        
#        for s in db.scopes()
        
        
        