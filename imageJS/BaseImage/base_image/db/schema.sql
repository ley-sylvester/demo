
CREATE USER lab IDENTIFIED BY lab
DEFAULT TABLESPACE users
QUOTA UNLIMITED ON users;

GRANT CONNECT, RESOURCE TO lab;

CREATE TABLE lab.customers (
    customer_id NUMBER PRIMARY KEY,
    name VARCHAR2(100),
    city VARCHAR2(100)
);


INSERT INTO lab.customers VALUES (1,'Alice','Austin');
INSERT INTO lab.customers VALUES (2,'Bob','Dallas');
INSERT INTO lab.customers VALUES (3,'Carlos','Houston');

COMMIT;