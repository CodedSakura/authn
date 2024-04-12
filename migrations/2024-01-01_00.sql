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
    perms     text[] default array [],
    expires   date   default date '2100-01-01',
    passReset bool   default false,
    resetCode text   default ''
);


create table codes
(
    code    text primary key not null,
    expires date   default date '2100-01-01',
    perms   text[] default array []
);

insert into codes
values ('root-code', array [ 'root' ]);
