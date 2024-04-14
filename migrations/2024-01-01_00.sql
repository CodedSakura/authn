-- initial migration

-- single row migrations table
create table migrations
(
    _id     bool primary key default true,
    version text not null,
    constraint _uniq check ( _id )
);

insert into migrations (version)
values ('2024-01-01_00');


create table users
(
    username  text primary key not null,
    password  text             not null,
    perms text[] default array [] :: text[],
    expires   date   default date '2100-01-01',
    passReset bool   default false,
    resetCode text   default ''
);


create table codes
(
    code    text primary key not null,
    expires date   default date '2100-01-01',
    issued date   default now() :: date,
    perms  text[] default array [] :: text[]
);

insert into codes (code, perms)
values ('root-code', array [ 'root' ]);


-- https://github.com/voxpelli/node-connect-pg-simple/blob/HEAD/table.sql
CREATE TABLE session
(
    sid    text         NOT NULL COLLATE "default",
    sess   json         NOT NULL,
    expire timestamp(6) NOT NULL,
    CONSTRAINT session_pkey PRIMARY KEY (sid) NOT DEFERRABLE INITIALLY IMMEDIATE
)
    WITH (OIDS = FALSE);

CREATE INDEX IDX_session_expire ON session (expire);
