-- language=PostgreSQL
-- initial migration

-- single row migrations table
create table migrations (
    _id     bool primary key default true,
    version text not null,
    constraint _uniq check ( _id )
);
insert into migrations (version) values ('2024-04-12_00');

create table users (
    username text primary key not null,
    password text,
    perms    text[]
);
