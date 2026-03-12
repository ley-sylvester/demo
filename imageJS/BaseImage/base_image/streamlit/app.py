import streamlit as st
import oracledb
import pandas as pd
import os

st.title("Oracle Database Lab")

connection = oracledb.connect(
    user=os.getenv("DB_USER"),
    password=os.getenv("DB_PASSWORD"),
    dsn=os.getenv("DB_DSN")
)

cursor = connection.cursor()

st.subheader("Run SQL Query")

query = st.text_area(
"Enter SQL",
"SELECT * FROM customers"
)

if st.button("Run Query"):

    try:
        cursor.execute(query)

        rows = cursor.fetchall()

        columns = [col[0] for col in cursor.description]

        df = pd.DataFrame(rows, columns=columns)

        st.dataframe(df)

    except Exception as e:
        st.error(e)

connection.close()