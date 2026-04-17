alter table public.pets
  add column if not exists birth_date date,
  add column if not exists expected_adult_weight_kg numeric,
  add column if not exists reproductive_state text default 'MAINTENANCE',
  add column if not exists gestation_week integer,
  add column if not exists lactation_week integer,
  add column if not exists litter_size integer;

update public.pets
set activity_level = case activity_level
  when 'LOW' then 'LOW'
  when 'MODERATE' then 'MODERATE_LOW_IMPACT'
  when 'HIGH' then 'MODERATE_HIGH_IMPACT'
  when 'WORKING' then 'HIGH_WORKING'
  else activity_level
end
where activity_level in ('LOW', 'MODERATE', 'HIGH', 'WORKING');

alter table public.pets
  add constraint pets_reproductive_state_check
  check (
    reproductive_state is null
    or reproductive_state in ('MAINTENANCE', 'GESTATION', 'LACTATION')
  )
  not valid;

alter table public.pets
  validate constraint pets_reproductive_state_check;

alter table public.pets
  add constraint pets_expected_adult_weight_positive_check
  check (
    expected_adult_weight_kg is null
    or expected_adult_weight_kg > 0
  )
  not valid;

alter table public.pets
  validate constraint pets_expected_adult_weight_positive_check;

alter table public.pets
  add constraint pets_gestation_week_check
  check (
    gestation_week is null
    or gestation_week between 1 and 9
  )
  not valid;

alter table public.pets
  validate constraint pets_gestation_week_check;

alter table public.pets
  add constraint pets_lactation_week_check
  check (
    lactation_week is null
    or lactation_week between 1 and 4
  )
  not valid;

alter table public.pets
  validate constraint pets_lactation_week_check;

alter table public.pets
  add constraint pets_litter_size_check
  check (
    litter_size is null
    or litter_size between 1 and 12
  )
  not valid;

alter table public.pets
  validate constraint pets_litter_size_check;
