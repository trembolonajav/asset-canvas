create table if not exists departments (
    id bigserial primary key,
    name varchar(120) not null unique,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create table if not exists spaces (
    id bigserial primary key,
    name varchar(160) not null,
    type varchar(20) not null check (type in ('UNIT', 'BUILDING', 'FLOOR', 'SECTOR')),
    parent_id bigint references spaces(id) on delete cascade,
    sort_order integer not null default 0,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create table if not exists stations (
    id bigserial primary key,
    code varchar(40) not null unique,
    name varchar(160) not null,
    description varchar(2000),
    location_code varchar(80),
    status varchar(20) not null check (status in ('ACTIVE', 'INACTIVE', 'MAINTENANCE')),
    observation varchar(2000),
    space_id bigint references spaces(id) on delete set null,
    layout_element_ref varchar(80),
    last_inventory_check_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create table if not exists employees (
    id bigserial primary key,
    full_name varchar(160) not null,
    cpf varchar(14) unique,
    status varchar(20) not null check (status in ('ACTIVE', 'INACTIVE')),
    department_id bigint references departments(id) on delete set null,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create table if not exists station_responsibilities (
    id bigserial primary key,
    station_id bigint not null references stations(id) on delete cascade,
    employee_id bigint not null references employees(id) on delete restrict,
    started_at timestamp not null default now(),
    ended_at timestamp,
    is_current boolean not null default true,
    notes varchar(2000),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create unique index if not exists ux_station_responsibilities_current
    on station_responsibilities (station_id)
    where is_current = true;

create table if not exists assets (
    id bigserial primary key,
    asset_code varchar(60) not null unique,
    type varchar(80) not null,
    description varchar(255) not null,
    serial_number varchar(120),
    status varchar(20) not null check (status in ('ACTIVE', 'INACTIVE', 'MAINTENANCE', 'DISPOSED', 'IN_STOCK')),
    origin varchar(30) not null default 'MANUAL' check (origin in ('MANUAL', 'LEGACY_GLPI')),
    manufacturer varchar(120),
    model varchar(120),
    processor varchar(255),
    operating_system varchar(120),
    acquisition_date date,
    notes varchar(2000),
    last_inventory_check_at timestamp,
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create table if not exists asset_assignments (
    id bigserial primary key,
    asset_id bigint not null references assets(id) on delete cascade,
    station_id bigint not null references stations(id) on delete restrict,
    assigned_by varchar(120),
    assigned_at timestamp not null default now(),
    unassigned_at timestamp,
    status varchar(20) not null check (status in ('ACTIVE', 'RETURNED')),
    notes varchar(2000),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create unique index if not exists ux_asset_assignments_active
    on asset_assignments (asset_id)
    where status = 'ACTIVE';

create table if not exists asset_movements (
    id bigserial primary key,
    asset_id bigint not null references assets(id) on delete cascade,
    movement_type varchar(30) not null check (movement_type in ('CREATED', 'UPDATED', 'LINKED', 'UNLINKED', 'TRANSFERRED', 'STATUS_CHANGED', 'INVENTORY_CHECKED')),
    from_station_id bigint references stations(id) on delete set null,
    to_station_id bigint references stations(id) on delete set null,
    from_employee_id bigint references employees(id) on delete set null,
    to_employee_id bigint references employees(id) on delete set null,
    moved_by varchar(120),
    reason varchar(2000),
    moved_at timestamp not null default now(),
    created_at timestamp not null default now(),
    updated_at timestamp not null default now()
);

create index if not exists ix_spaces_parent_id on spaces(parent_id);
create index if not exists ix_stations_space_id on stations(space_id);
create index if not exists ix_employees_department_id on employees(department_id);
create index if not exists ix_assets_status on assets(status);
create index if not exists ix_asset_assignments_station_status on asset_assignments(station_id, status);
create index if not exists ix_asset_movements_asset_id on asset_movements(asset_id);
create index if not exists ix_station_responsibilities_employee_id on station_responsibilities(employee_id);

create or replace function set_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists trg_departments_updated_at on departments;
create trigger trg_departments_updated_at
before update on departments
for each row execute function set_updated_at();

drop trigger if exists trg_spaces_updated_at on spaces;
create trigger trg_spaces_updated_at
before update on spaces
for each row execute function set_updated_at();

drop trigger if exists trg_stations_updated_at on stations;
create trigger trg_stations_updated_at
before update on stations
for each row execute function set_updated_at();

drop trigger if exists trg_employees_updated_at on employees;
create trigger trg_employees_updated_at
before update on employees
for each row execute function set_updated_at();

drop trigger if exists trg_station_responsibilities_updated_at on station_responsibilities;
create trigger trg_station_responsibilities_updated_at
before update on station_responsibilities
for each row execute function set_updated_at();

drop trigger if exists trg_assets_updated_at on assets;
create trigger trg_assets_updated_at
before update on assets
for each row execute function set_updated_at();

drop trigger if exists trg_asset_assignments_updated_at on asset_assignments;
create trigger trg_asset_assignments_updated_at
before update on asset_assignments
for each row execute function set_updated_at();

drop trigger if exists trg_asset_movements_updated_at on asset_movements;
create trigger trg_asset_movements_updated_at
before update on asset_movements
for each row execute function set_updated_at();

create or replace view vw_asset_inventory as
select
    a.id as asset_id,
    a.asset_code,
    a.type as asset_type,
    a.description as asset_description,
    a.serial_number,
    a.status as asset_status,
    a.origin as asset_origin,
    st.id as station_id,
    st.code as station_code,
    st.name as station_name,
    st.status as station_status,
    e.id as employee_id,
    e.full_name as employee_name,
    d.id as department_id,
    d.name as department_name,
    aa.assigned_at,
    a.last_inventory_check_at,
    a.updated_at as asset_updated_at
from assets a
left join asset_assignments aa
    on aa.asset_id = a.id
   and aa.status = 'ACTIVE'
left join stations st
    on st.id = aa.station_id
left join station_responsibilities sr
    on sr.station_id = st.id
   and sr.is_current = true
left join employees e
    on e.id = sr.employee_id
left join departments d
    on d.id = e.department_id;
