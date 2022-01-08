DROP TABLE IF EXISTS reviews;
CREATE TABLE IF NOT EXISTS reviews(
    id SERIAL PRIMARY KEY,
    brewery_name VARCHAR NOT NULL,
    review VARCHAR NOT NULL,
    review_date VARCHAR NOT NULL
);