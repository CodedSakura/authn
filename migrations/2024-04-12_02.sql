update migrations
set version = '2024-04-12_02'
where _id;

create table codes
(
    code    text primary key not null,
    expires date
);
insert into codes
values ('root-code', DATE '2100-01-01');
