'''
Created on Mar 28, 2020

@author: ballance
'''
from PyQt5.QtWidgets import QTreeView
from PyQt5.Qt import QStandardItemModel, Qt, QFileSystemModel

class InstanceTree(QTreeView):
    
    def __init__(self, model):
        super().__init__()
        
#        model = QStandardItemModel(0, 2, self)
#        model.setHeaderData(0, Qt.Horizontal, "Instance")
#        model.setHeaderData(1, Qt.Horizontal, "Coverage")

        self.model = model
        self.setModel(model)
        
        
        self.show()
        