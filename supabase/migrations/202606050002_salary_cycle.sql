alter table public.profiles
  add column if not exists salary_cycle_day integer default 1 check (salary_cycle_day between 1 and 31);

alter table public.profiles
  add column if not exists salary_adjusts_to_business_day boolean default true;

update public.profiles
set salary_cycle_day = coalesce(salary_cycle_day, 1),
    salary_adjusts_to_business_day = coalesce(salary_adjusts_to_business_day, true);
