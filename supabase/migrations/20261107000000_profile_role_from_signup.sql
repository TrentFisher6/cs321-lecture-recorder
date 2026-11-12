-- Use the role picked at sign-up ('student' or 'staff'); anything else becomes 'student'.
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, name, role) values (
    new.id,
    new.raw_user_meta_data ->> 'name',
    case when new.raw_user_meta_data ->> 'role' = 'staff' then 'staff' else 'student' end
  );
  return new;
end;
$$;
