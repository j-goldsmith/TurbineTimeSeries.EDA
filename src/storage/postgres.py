import csv
import glob
import re
import pandas as pd
from sqlalchemy import create_engine
from sqlalchemy.sql.elements import quoted_name


class SqlImport:
    def __init__(self, config_path):
        self.config = self._load_config(config_path)

        if 'postgres_connection_url' in self.config.keys():
            self.sql = create_engine(self.config['postgres_connection_url'])

    def _load_config(self,file_path):
        data = {}
        with open(file_path) as f:
            reader = csv.reader(f, skipinitialspace=True, quotechar="'")
            for row in reader:
                data[row[0]] = row[1]

        return data

    def _psn_from_file_path(self, file_path):
        r = re.compile('psn_([0-9]+)_.+csv')
        psn = r.findall(file_path)

        return int(psn[0]) if len(psn) > 0 else None

    def _csv_to_df(self, file_path):
        psn = self._psn_from_file_path(file_path)
        df = pd.read_csv(file_path)

        df['PSN'] = psn
        df['TIMESTAMP'] = pd.to_datetime(df['TIMESTAMP'])

        df.reset_index(drop=True, inplace=True)
        return df

    def _drop_table(self,table_name):
        with self.sql.connect() as c:
            c.execute('DROP TABLE IF EXISTS {}'.format(table_name))

    def _create_table(self, table_name, csv_path):
        df = self._csv_to_df(csv_path)

        sql_table = pd.io.sql.SQLTable(
            table_name,
            pd.io.sql.SQLDatabase(self.sql),
            frame=df,
            index=True,
            index_label="id",
            keys="id"
        )
        sql_table.create()

    def import_csvs(self, directory, destination_table, drop_create_table=True):
        files = glob.glob(directory + "/*.csv")
        destination_table = quoted_name(destination_table.lower(), False)

        if drop_create_table:
            self._drop_table(destination_table)

        with self.sql.connect() as c:
            if not self.sql.has_table(destination_table):
                self._create_table(destination_table, files[0])

            for file in files:
                df = self._csv_to_df(file)

                df.to_sql(
                    destination_table,
                    self.sql,
                    if_exists='append',
                    index=False)


if __name__ == "__main__":
    data_dir = '../../data'
    config_path = '../../.config'

    importer = SqlImport(config_path)

    importer.import_csvs(data_dir + '/Model 1', "Sensor_Readings_Model1_Hourly")
    importer.import_csvs(data_dir + '/Model 2', "Sensor_Readings_Model2_Hourly")
