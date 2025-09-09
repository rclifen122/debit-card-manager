-- Enable for UUID generation if needed
create extension if not exists "pgcrypto";

-- Enum for transaction type
do $$ begin
  create type transaction_type as enum ('credit','debit');
exception when duplicate_object then null; end $$;

-- Cards table
create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  card_number varchar(4) not null,
  card_name text not null,
  department text,
  current_balance numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

-- Transactions table
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  type transaction_type not null,
  amount numeric(12,2) not null check (amount >= 0),
  description text,
  category varchar(100),
  vendor_name text,
  client_partner_name text,
  transaction_date timestamptz not null default now(),
  created_by text,
  created_at timestamptz not null default now()
);

-- Balance snapshots table
create table if not exists public.balance_snapshots (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  balance numeric(12,2) not null,
  snapshot_date date not null default current_date,
  created_at timestamptz not null default now()
);

-- Triggers to keep current_balance in sync
create or replace function public._t_ins_tx_update_balance() returns trigger language plpgsql as $$
begin
  if new.type='credit' then
    update public.cards set current_balance=current_balance+new.amount, updated_at=now() where id=new.card_id;
  else
    update public.cards set current_balance=current_balance-new.amount, updated_at=now() where id=new.card_id;
  end if;
  return new;
end;
$$;

create or replace function public._t_upd_tx_update_balance() returns trigger language plpgsql as $$
declare delta numeric;
begin
  if old.card_id = new.card_id then
    delta := case old.type when 'credit' then -old.amount else old.amount end;
    delta := delta + case new.type when 'credit' then new.amount else -new.amount end;
    update public.cards set current_balance=current_balance+delta, updated_at=now() where id=new.card_id;
  else
    if old.type='credit' then
      update public.cards set current_balance=current_balance-old.amount, updated_at=now() where id=old.card_id;
    else
      update public.cards set current_balance=current_balance+old.amount, updated_at=now() where id=old.card_id;
    end if;
    if new.type='credit' then
      update public.cards set current_balance=current_balance+new.amount, updated_at=now() where id=new.card_id;
    else
      update public.cards set current_balance=current_balance-new.amount, updated_at=now() where id=new.card_id;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public._t_del_tx_update_balance() returns trigger language plpgsql as $$
begin
  if old.type='credit' then
    update public.cards set current_balance=current_balance-old.amount, updated_at=now() where id=old.card_id;
  else
    update public.cards set current_balance=current_balance+old.amount, updated_at=now() where id=old.card_id;
  end if;
  return old;
end;
$$;

drop trigger if exists t_ai_tx on public.transactions;
create trigger t_ai_tx after insert on public.transactions for each row execute function public._t_ins_tx_update_balance();

drop trigger if exists t_au_tx on public.transactions;
create trigger t_au_tx after update on public.transactions for each row execute function public._t_upd_tx_update_balance();

drop trigger if exists t_ad_tx on public.transactions;
create trigger t_ad_tx after delete on public.transactions for each row execute function public._t_del_tx_update_balance();

-- Helpful indexes
create index if not exists idx_transactions_card on public.transactions(card_id);
create index if not exists idx_transactions_date on public.transactions(transaction_date desc);
create index if not exists idx_transactions_type on public.transactions(type);
create index if not exists idx_transactions_category on public.transactions(category);

