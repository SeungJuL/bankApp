CREATE TABLE users(
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL,
    password VARCHAR(64) NOT NULL
);

CREATE TABLE bank_accounts(
    id BIGSERIAL PRIMARY KEY,
    balance INT DEFAULT 0,
    fk_user INT REFERENCES users(id)
);
