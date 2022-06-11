'''
Created on Jan 5, 2020

@author: ballance
'''
import argparse
import traceback
from pyucis_viewer.main_window import MainWindow
from pyucis_viewer.data_model import DataModel
import sys
from PyQt5.QtWidgets import QApplication
from ucis.xml.xml_factory import XmlFactory


def get_parser():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", help="UCIS XML file")
    
    return parser

def main():
    parser = get_parser()
    
    args = parser.parse_args()
    
    data_model = DataModel()
   
    db = None 
    if args.file.endswith(".xml"):
        try:
            db = XmlFactory.read(args.file)
        except Exception as e:
            print("Failed to read UCIS file \"%s\": %s" % (
                args.file,
                str(e)), flush=True)
            sys.exit(1)
    else:
        print("Error: unknown suffix for coverage file " + args.file)
        sys.exit(1)

    app = QApplication(sys.argv)    
    main_win = MainWindow(data_model)
    
    # Notify everyone that a new database is available
    data_model.load(db)
    
    sys.exit(app.exec_())
    

if __name__ == "__main__":
    main()
    