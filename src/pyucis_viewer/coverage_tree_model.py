'''
Created on Mar 29, 2020

@author: ballance
'''
from typing import Dict

from PyQt5 import QtWidgets, QtCore
from PyQt5.Qt import QStandardItemModel, QStandardItem, Qt

from pyucis_viewer.data_model_listener import DataModelListener
from ucis.report.coverage_report import CoverageReport


class CoverageTreeModel(QStandardItemModel, DataModelListener):
    
    def __init__(self):
        QStandardItemModel.__init__(self, 0, 3)
        self.db = None
        self.report = None

#        self.setColumnCount(2)        
        

    def data_loaded(self, db):
        self.clear()
        self.db = db

        self.report = self.build_report(self.db)
        
        self.populate_model()
        # Note: must populate column names after model
        self.setHeaderData(0, Qt.Horizontal, "Name")
        self.setHeaderData(1, Qt.Horizontal, "Coverage")
        self.setHeaderData(2, Qt.Horizontal, "Status")
        
    def build_report(self, db)->CoverageReport:
        report = CoverageReport()
        
        cg1 = report.add_covergroup(CoverageReport.Covergroup("a", "top"))
        cg1.coverage = 75.0
        cg1_cp1 = cg1.add_coverpoint(CoverageReport.Coverpoint("cp1"))
        cg1_cp2 = cg1.add_coverpoint(CoverageReport.Coverpoint("cp2"))
        cg2 = report.add_covergroup(CoverageReport.Covergroup("b", "top"))
        cg2.coverage = 35.0
        cg2_cp1 = cg2.add_coverpoint(CoverageReport.Coverpoint("cp1"))
        cg2_cp2 = cg2.add_coverpoint(CoverageReport.Coverpoint("cp2"))
        
        return report
    
    def populate_model(self):
        self.clear()
        root = self.invisibleRootItem()
        
        inst_m : Dict[str,object] = {}
        
        for cg in self.report.covergroups:
            inst_n = None
            if not cg.instname in inst_m.keys():
                inst_n = QStandardItem("TYPE: " + cg.instname)
                cov_n = QStandardItem("%0.2f%%" % cg.coverage)
                cov_p = QStandardItem()
                cov_p.setData(cg.coverage, QtCore.Qt.UserRole+1000)
                root.appendRow([inst_n, cov_n, cov_p])
                inst_m[cg.instname] = inst_n
            else:
                inst_n = inst_m[cg.instname]
                
            self.populate_covergroup_model(inst_n, cg)
            
    def populate_covergroup_model(self, inst_n, cg):
        cg_n = QStandardItem("INST: " + cg.name)
        cov_n = QStandardItem("%0.2f%%" % cg.coverage)
        cov_p = QStandardItem()
        cov_p.setData(cg.coverage, QtCore.Qt.UserRole+1000)
        inst_n.appendRow([cg_n, cov_n, cov_p])
        
        for cp in cg.coverpoints:
            self.populate_coverpoint(cg_n, cp)
    
    def populate_coverpoint(self, cg_n, cp):
        cp_n = QStandardItem("CVP: " + cp.name)
        cov_n = QStandardItem("%0.2f%%" % cp.coverage)
        cov_p = QStandardItem()
        cov_p.setData(cp.coverage, QtCore.Qt.UserRole+1000)
        cg_n.appendRow([cp_n, cov_n, cov_p])
        
        for bn in cp.bins:
            self.populate_coverpoint_bin(cp_n, bn)
            

    def populate_coverpoint_bin(self, cp_n, bn):
        pass
    

    
    

        
