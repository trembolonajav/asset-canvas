create table if not exists space_layouts (
    id bigserial primary key,
    space_id bigint not null unique references spaces(id) on delete cascade,
    name varchar(160) not null,
    code varchar(80) not null,
    width integer not null,
    height integer not null,
    layout_json text not null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create index if not exists ix_space_layouts_space_id on space_layouts(space_id);

drop trigger if exists trg_space_layouts_updated_at on space_layouts;
create trigger trg_space_layouts_updated_at
before update on space_layouts
for each row execute function set_updated_at();
