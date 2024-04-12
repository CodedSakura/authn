update migrations
set version = '2024-04-12_03'
where _id;

alter table codes
    add column perms text[];
update codes
set perms = array [ 'root' ]
where code = 'root-code';

alter table users
    add column passReset bool default false;
