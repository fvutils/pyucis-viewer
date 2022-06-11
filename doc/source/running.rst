#####################
Running PyUCIS Viewer
#####################

In its current form, PyUCIS Viewer is extremely simple. In order to 
run the tool, you must have an XML file formatted according to the
`UCIS XML interchange format <http://accellera.org/download/standards/ucis>`_. 

A common way to obtain such a file is by saving collected coverage from
the PyVSC library. See the `PyVSC Documentation <https://fvutils.github.io/pyvsc>`_
for more details.

PyUCIS Viewer accepts a single argument: the coverage XML file.

.. code:: shell

  % pyucis-viewer cov.xml
  
  
