'''
Created on Mar 28, 2020

@author: ballance
'''
from PyQt5.Qt import QWidget, QHBoxLayout, QTreeView
from PyQt5.QtWidgets import QLabel, QGroupBox, QGridLayout, QSplitter

from pyucis_viewer.coverage_tree_model import CoverageTreeModel
from pyucis_viewer.data_model import DataModel
from pyucis_viewer.data_model_listener import DataModelListener
from pyucis_viewer.instance_tree import InstanceTree
from pyucis_viewer.instance_tree_model import InstanceTreeModel


class MainWindow(QWidget, DataModelListener):
    
    def __init__(self, data_model : DataModel):
        super().__init__()
        self.data_model = data_model
        self.data_model.add_listener(self)
        
        width=640
        height=480

        self.setWindowTitle("PyUCIS Viewer")
        self.setGeometry(10, 10, width, height)
        
        self.splitter = QSplitter()
        
        
#        self.horizontalGroupBox = QGroupBox(self)
#        layout = QGridLayout()
#        layout.setColumnStretch(1, 4)
#        layout.setColumnStretch(2, 4)

        layout = QHBoxLayout()


        self.instTreeModel = InstanceTreeModel()
        self.data_model.add_listener(self.instTreeModel)
        self.instTreeView = QTreeView()
        self.instTreeView.setModel(self.instTreeModel)
        self.splitter.addWidget(self.instTreeView)

        self.coverageTreeModel = CoverageTreeModel()
        self.data_model.add_listener(self.coverageTreeModel)
        self.coverageTree = QTreeView()
        self.coverageTree.setModel(self.coverageTreeModel)
        self.splitter.addWidget(self.coverageTree)
        
        layout.addWidget(self.splitter)
        self.setLayout(layout)

        # Set the initial split to 30/70        
        self.splitter.setSizes([int(width*0.3), int(width*0.7)])
#        layout.addWidget(self.splitter, 0, 0)
        
#        self.horizontalGroupBox.setLayout(layout)

        self.show()

    def data_loaded(self, db):
        pass