'''
Created on Jan 5, 2020

@author: ballance
'''
import argparse
from pyucis_viewer.main_window import MainWindow
from pyucis_viewer.data_model import DataModel
import sys
from PyQt5.QtWidgets import QApplication


def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="UCIS XML file")
    
    return parser

def main():
    parser = get_parser()
    
    args = parser.parse_args()
    
    data_model = DataModel()

    app = QApplication(sys.argv)    
    main_win = MainWindow(data_model)
    
    # Notify everyone that a new database is available
    data_model.load(None)
    
    sys.exit(app.exec_())
    

if __name__ == "__main__":
    main()
    