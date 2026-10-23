create table JikanUser (
    user_id varchar(30) primary key not null,
    user_name varchar(50) not null,
    is_hidden bool default 0
);

create table Jikan (
	announcement_message text
);

create table JikanBannedIDs(
	id varchar(30) primary key not null
);

create table JikanGuildSettings (
    server_id varchar(30) primary key not null,
    leaderboard_name varchar(40),
	log_channel varchar(30), 
	webhook_url text,
	ignored_role varchar(30),
    server_locale varchar(5)
);

create table JikanGuildLeaderboard (
    user_id varchar(30) not null, 
    user_name varchar(50) not null, 
    vc_time bigint not null,
    server_id varchar(30) not null,
    primary key (user_id, server_id)
);


/* 
ONLY RUN THE ABOVE. BELOW ARE JUST FOR DEBUG PURPOSES
上記のみを実行してください。以下はデバッグ目的のみです。
*/

select count(*) from jikanguildleaderboard;
select count(*) from jikangloballeaderboard;
select * from jikanguildsettings;

SELECT server_id, vc_time 
FROM JikanGuildLeaderboard 
WHERE user_id = '695154895036088384';

select server_locale from jikanguildsettings where server_id = '1231574575096004649';

update jikanguildsettings
	set server_locale = 'en-US'
where server_id = '1231574575096004649';

/* get all user time */
select 
	userdb.user_id,
	coalesce(userdb.is_hidden, 0) as user_hidden,
	coalesce(sum(case when lb.server_id = '1231574575096004649' then lb.vc_time else 0 end), 0) as local_time,
	coalesce(sum(lb.vc_time), 0) as global_time
from JikanUser as userdb
left join JikanGuildLeaderboard as lb 
	on userdb.user_id = lb.user_id
where userdb.user_id = '695154895036088384'
group by userdb.user_id, userdb.is_hidden;
/* --- */

/* select from a specific server */
select * from JikanGuildLeaderboard 
	where server_id = '1231574575096004649'
	order by vc_time desc;
/* --- */

ALTER TABLE jikanuser 
  CONVERT TO CHARACTER SET utf8mb4 
  COLLATE utf8mb4_0900_ai_ci;

/* combine dupes and fix primary key */
create table `temp` as
select 
    user_id, 
    max(user_name) as user_name, 
    sum(vc_time) as vc_time, 
    server_id
from `jikanguildleaderboard`
group by user_id, server_id;

truncate table `jikanguildleaderboard`;

alter table `jikanguildleaderboard`
add primary key (`user_id`, `server_id`);

insert into `jikanguildleaderboard` (user_id, user_name, vc_time, server_id)
select user_id, user_name, vc_time, server_id 
from `temp`;
drop table `temp`;
/* --- */

/* check dupes */
select user_id, max(user_name) as user_name, count(*) as total_entries
from `jikanguildleaderboard`
group by user_id
having count(*) > 1 order by total_entries desc;
/* --- */
