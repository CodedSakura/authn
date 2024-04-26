update migrations
set version = '2024-04-26_01'
where _id;

alter table users
    alter expires set default null;
update users
set expires = null
where expires = date '2100-01-01';

alter table codes
    alter expires set default null;
update codes
set expires = null
where expires = date '2100-01-01';
