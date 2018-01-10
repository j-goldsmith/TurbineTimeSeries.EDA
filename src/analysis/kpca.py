import csv
import pandas as pd
import seaborn as sns
import matplotlib.pyplot as plt
from sklearn.decomposition import KernelPCA
from sqlalchemy import create_engine



def _load_config(file_path):
    data = {}
    with open(file_path) as f:
        reader = csv.reader(f, skipinitialspace=True, quotechar="'")
        for row in reader:
            data[row[0]] = row[1]

    return data

class MachineDataKPCA:
    def __init__(self, *args, **kwargs):
        pass

    def fit(self, X):
        pass

    def transform(self, X):
        pass

    def fit_transform(self, X):
        self.fit(X)
        return self.transform(X)

    def spe(self):
        pass




if __name__ == "__main__":

    config_path = '../.config'
    data_path = '../data/'
    plt.rcParams["figure.figsize"] = (15,15)
    config = _load_config(config_path)
    sql = create_engine(config['postgres_connection_url'])


    psns = (pd.read_sql('''SELECT * from sensor_readings_model1_hourly''',sql)
        .groupby(by='PSN'))
