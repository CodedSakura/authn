update migrations
set version = '2024-04-12_01'
where _id;

alter table users
    add column expires date;
