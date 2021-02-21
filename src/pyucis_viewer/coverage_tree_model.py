'''
Created on Mar 29, 2020

@author: ballance
'''
from typing import Dict

from PyQt5 import QtWidgets, QtCore
from PyQt5.Qt import QStandardItemModel, QStandardItem, Qt

from pyucis_viewer.data_model_listener import DataModelListener
from ucis.report.coverage_report import CoverageReport
from ucis.report.coverage_report_builder import CoverageReportBuilder


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
        report = CoverageReportBuilder.build(db)
        return report
    
    def populate_model(self):
        self.clear()
        root = self.invisibleRootItem()
        
        for cg in self.report.covergroups:
            cg_n = QStandardItem("TYPE: " + cg.instname)
            cov_n = QStandardItem("%0.2f%%" % cg.coverage)
            cov_p = QStandardItem()
            cov_p.setData(cg.coverage, QtCore.Qt.UserRole+1000)
            root.appendRow([cg_n, cov_n, cov_p])
            
            # Add type coverpoints
            for cp in cg.coverpoints:
                self.populate_coverpoint(cg_n, cp)
                
            for cr in cg.crosses:
                self.populate_cross(cg_n, cr)

            for cg_i in cg.covergroups:                
                self.populate_covergroup_model(cg_n, cg_i)
            
    def populate_covergroup_model(self, inst_n, cg):
        cg_n = QStandardItem("INST: " + cg.name)
        cov_n = QStandardItem("%0.2f%%" % cg.coverage)
        cov_p = QStandardItem()
        cov_p.setData(cg.coverage, QtCore.Qt.UserRole+1000)
        inst_n.appendRow([cg_n, cov_n, cov_p])
        
        for cp in cg.coverpoints:
            self.populate_coverpoint(cg_n, cp)
            
        for cr in cg.crosses:
            self.populate_cross(cg_n, cr)
    
    def populate_coverpoint(self, cg_n, cp):
        cp_n = QStandardItem("CVP: " + cp.name)
        cov_n = QStandardItem("%0.2f%%" % cp.coverage)
        cov_p = QStandardItem()
        cov_p.setData(cp.coverage, QtCore.Qt.UserRole+1000)
        cg_n.appendRow([cp_n, cov_n, cov_p])
        
        for bn in cp.bins:
            self.populate_coverpoint_bin(cp_n, bn)
            

    def populate_coverpoint_bin(self, cp_n, bn):
        bn_n = QStandardItem(bn.name)
        cov_n = QStandardItem("%d" % bn.count)
        cov_p = QStandardItem()
        cov_p.setData(bn.count, QtCore.Qt.UserRole+2000)
        cp_n.appendRow([bn_n, cov_n, cov_p])
        
    def populate_cross(self, cg_n, cr):
        cr_n = QStandardItem("CROSS: " + cr.name)
        cov_n = QStandardItem("%0.2f%%" % cr.coverage)
        cov_p = QStandardItem()
        cov_p.setData(cr.coverage, QtCore.Qt.UserRole+1000)
        cg_n.appendRow([cr_n, cov_n, cov_p])
        
        for bn in cr.bins:
            self.populate_coverpoint_bin(cr_n, bn)
    
