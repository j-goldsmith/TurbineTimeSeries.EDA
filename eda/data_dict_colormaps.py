
"""
COLORMAPS USED FOR MAPPING THE DATA DICTIONARY TO THE RAW DATA. SHOULD BE USED
WITH 'SUBSYSTEM' AND 'MEASUREMENT_TYPE' COLUMNS IN THE DATA DICTIONARIES.

"""
subsystem_colormap = {
    'GAS PATH':'red',
    'FUEL':'yellow',
    'LUBE OIL SYSTEM':'orange',
    'PACKAGE EQUIPMENT':'blue',
    'VIBRATION':'green',
    'SUMMARY':'lightblue',
    'GENERATOR': 'purple',
    'ENCLOSURE': 'darkblue'

}

measurement_colormap = {
    'TEMPERATURE SPREAD':'lightcoral',
    'VECTOR MAGNITUDE':'lightcoral',
    'TEMPERATURE':'red',
    'TEMPERATURE (AVERAGE)':'red',
    'TEMPERATURE DIFFERENTIAL':'darkred',
    'DIFFERENTIAL TEMPERATURE':'darkred',

    'DIFFERENTIAL PRESSURE ':'lightblue',
    'PRESSURE DIFFERENTIAL':'lightblue',
    'PRESSURE':'blue',
    'PRESSURE RATIO':'darkblue',
    'PRESSURE RRATIO':'darkblue',

    'ERROR (%)':'lightyellow',
    'ERROR':'lightyellow',
    'COMMAND (%)':'yellow',
    'COMMAND' :'yellow',
    'FORCE':'yellow',
    'POSITION (%)':'orange',
    'POSITION':'orange',

    'GAP VOLTAGE':'lightgreen',
    'DISPLACEMENT':'green',
    'AMPLITUDE':'green',
    'CURRENT':'lightgreen',

    'LEVEL (LENGTH)':'lightgrey',
    'PERCENT (SPEED)':'grey',
    'PERCENT':'grey',
    'SPEED':'grey',
    'ACCELERATION':'grey',
    'POWER':'grey',
    'POWER FACTOR':'grey',
    'ENERGY': 'lightgrey',
    'COUNT':'black',
    'DATETIME':'black',
    'STR/INT':'black',
    'STRING': 'black'
    }
