'''
Created on Mar 28, 2020

@author: ballance
'''
import sys

from PyQt5 import QtWidgets, QtCore
from PyQt5.Qt import QWidget, QHBoxLayout, QTreeView, QMainWindow, QIcon
from PyQt5.QtWidgets import QLabel, QGroupBox, QGridLayout, QSplitter, QAction
from PyQt5.uic.Compiler.qtproxies import QtGui

from pyucis_viewer.coverage_tree_model import CoverageTreeModel
from pyucis_viewer.data_model import DataModel
from pyucis_viewer.data_model_listener import DataModelListener
from pyucis_viewer.instance_tree import InstanceTree
from pyucis_viewer.instance_tree_model import InstanceTreeModel


class MainWindow(QMainWindow, DataModelListener):
    
    def __init__(self, data_model : DataModel):
        super().__init__()
        self.data_model = data_model
        self.data_model.add_listener(self)
        
        width=640
        height=480

        self.setWindowTitle("PyUCIS Viewer")
        self.setGeometry(10, 10, width, height)
        
        self.statusBar()
        
        mainMenu = self.menuBar()
        fileMenu = mainMenu.addMenu("&File")
        
        exitAction = QAction(QIcon('exit.png'), "E&xit", self)
        exitAction.triggered.connect(self.do_exit)
        fileMenu.addAction(exitAction)
        
        
#         self.splitter = QSplitter()
        
        
#        self.horizontalGroupBox = QGroupBox(self)
#        layout = QGridLayout()
#        layout.setColumnStretch(1, 4)
#        layout.setColumnStretch(2, 4)

#        layout = QHBoxLayout()


#         self.instTreeModel = InstanceTreeModel()
#         self.data_model.add_listener(self.instTreeModel)
#         self.instTreeView = QTreeView()
#         self.instTreeView.setModel(self.instTreeModel)
#         self.splitter.addWidget(self.instTreeView)

        self.coverageTreeModel = CoverageTreeModel()
        self.data_model.add_listener(self.coverageTreeModel)
        self.coverageTree = QTreeView()
        self.progress_delegate = MainWindow.ProgressDelegate(self.coverageTree)
        self.coverageTree.setItemDelegateForColumn(2, self.progress_delegate)
        self.coverageTree.setModel(self.coverageTreeModel)
        self.coverageTree.show()
#        self.splitter.addWidget(self.coverageTree)
        
#        layout.addWidget(self.coverageTree)
#        self.setLayout(layout)
        self.setCentralWidget(self.coverageTree)

        # Set the initial split to 30/70        
#        self.splitter.setSizes([int(width*0.3), int(width*0.7)])
#        layout.addWidget(self.splitter, 0, 0)
        
#        self.horizontalGroupBox.setLayout(layout)

        self.show()

    def data_loaded(self, db):
        pass
    
    def do_exit(self):
        print("Exit")
        sys.exit()
        
    class ProgressDelegate(QtWidgets.QStyledItemDelegate):
        def paint(self, painter, option, index):
            if index.data(QtCore.Qt.UserRole+1000) is not None:
                progress = index.data(QtCore.Qt.UserRole+1000)
                opt = QtWidgets.QStyleOptionProgressBar()
                opt.rect = option.rect
                opt.minimum = 0
                opt.maximum = 100
                opt.progress = progress
                opt.text = "{}%".format(progress)
                opt.textVisible = True
                QtWidgets.QApplication.style().drawControl(QtWidgets.QStyle.CE_ProgressBar, opt, painter)
            elif index.data(QtCore.Qt.UserRole+2000) is not None:
                progress = index.data(QtCore.Qt.UserRole+2000)
                opt = QtWidgets.QStyleOptionProgressBar()
                opt.rect = option.rect
                opt.minimum = 0
                opt.maximum = 100
                opt.progress = 100 if progress > 0 else 0
                opt.text = "{}".format(progress)
                opt.textVisible = True
                QtWidgets.QApplication.style().drawControl(QtWidgets.QStyle.CE_ProgressBar, opt, painter)
                
        