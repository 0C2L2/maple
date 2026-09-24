-- Read-only public marketplace inventory. RLS still governs every joined table.
create index opportunities_explore on public.opportunities(type,created_at desc,id) where status='published';
create index events_explore_starts on public.events(starts_at,id) where status='published';
create function public.list_public_opportunities(
 p_type public.opportunity_type,
 p_categories text[] default '{}', p_audience_types text[] default '{}',
 p_attendance_bands text[] default '{}', p_regions text[] default '{}',
 p_formats text[] default '{}', p_limit integer default 20, p_offset integer default 0
) returns table(
 opportunity_id uuid,type public.opportunity_type,title text,slug text,excerpt text,created_at timestamptz,
 organization_name text,organization_slug text,event_id uuid,event_title text,event_slug text,
 starts_at timestamptz,ends_at timestamptz,timezone text,format text,city text,country text,
 categories text[],audience_types text[],attendance_bands text[],regions text[],
 tier_count bigint,has_cash_tier boolean,has_in_kind_tier boolean,
 primary_tier_name text,primary_tier_price_minor bigint,primary_tier_currency text,primary_tier_in_kind boolean
) language plpgsql stable security invoker set search_path='' as $$
begin
 -- NULL/empty arrays mean no filter. Invalid canonical values are safely rejected.
 if p_type is null
 or not coalesce(p_categories,'{}') <@ array['hackathon','conference','meetup','workshop','festival']::text[]
 or not coalesce(p_audience_types,'{}') <@ array['developers','students','founders','designers','marketers']::text[]
 or not coalesce(p_attendance_bands,'{}') <@ array['under-50','50-199','200-999','1000-plus']::text[]
 or not coalesce(p_regions,'{}') <@ array['africa','asia','europe','north-america','south-america','oceania','online']::text[]
 or not coalesce(p_formats,'{}') <@ array['in_person','online','hybrid']::text[]
 then raise exception 'Invalid discovery filters' using errcode='22023'; end if;
 return query
 select o.id,o.type,o.title,o.slug,left(coalesce(o.description,''),240),o.created_at,
 org.name,org.slug,e.id,e.title,e.slug,e.starts_at,e.ends_at,e.timezone,e.format::text,e.city,e.country,
 case when o.type='package' then e.categories else c.target_categories end,
 case when o.type='package' then e.audience_types else c.target_audience_types end,
 case when o.type='package' then array[e.attendance_band] else c.target_attendance_bands end,
 c.target_regions,coalesce(t.n,0),coalesce(t.cash,false),coalesce(t.kind,false),
 first_tier.name,first_tier.price_minor,first_tier.currency,first_tier.in_kind
 from public.opportunities o
 join public.organizations org on org.id=o.owner_org_id
 left join public.events e on o.type='package' and e.id=o.event_id
 left join public.opportunity_call_details c on o.type='call' and c.opportunity_id=o.id
 left join lateral (select count(*) n,bool_or(not ot.in_kind) cash,bool_or(ot.in_kind) kind
   from public.opportunity_tiers ot where o.type='package' and ot.opportunity_id=o.id) t on true
 left join lateral (select ot.name,ot.price_minor,ot.currency,ot.in_kind
   from public.opportunity_tiers ot where o.type='package' and ot.opportunity_id=o.id
   order by ot.sort_order asc,ot.id asc limit 1) first_tier on true
 where o.type=p_type and o.status='published'
 and ((o.type='package' and e.status='published' and e.ends_at>=now()) or (o.type='call' and c.opportunity_id is not null))
 and (coalesce(cardinality(p_categories),0)=0 or p_categories && case when o.type='package' then e.categories else c.target_categories end)
 and (coalesce(cardinality(p_audience_types),0)=0 or p_audience_types && case when o.type='package' then e.audience_types else c.target_audience_types end)
 and (coalesce(cardinality(p_attendance_bands),0)=0 or p_attendance_bands && case when o.type='package' then array[e.attendance_band] else c.target_attendance_bands end)
 and (o.type<>'call' or coalesce(cardinality(p_regions),0)=0 or p_regions && c.target_regions)
 and (o.type<>'package' or coalesce(cardinality(p_formats),0)=0 or e.format::text=any(p_formats))
 order by case when o.type='package' then e.starts_at end asc,
 case when o.type='call' then o.created_at end desc,o.id asc
 limit greatest(1,least(coalesce(p_limit,20),50)) offset greatest(0,coalesce(p_offset,0));
end $$;
revoke all on function public.list_public_opportunities(public.opportunity_type,text[],text[],text[],text[],text[],integer,integer) from public,anon,authenticated,service_role;
grant execute on function public.list_public_opportunities(public.opportunity_type,text[],text[],text[],text[],text[],integer,integer) to authenticated;
