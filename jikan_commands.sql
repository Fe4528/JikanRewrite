create table JikanUser (
    user_id varchar(30) primary key not null,
    user_name varchar(50) not null,
    vc_time bigint not null,
    is_hidden bool default 0
);

create table Jikan (
	announcement_message text
);

create table JikanBannedUsers (
	user_id varchar(30) primary key not null
);

create table JikanGuildLeaderboardSettings (
    server_id varchar(30) primary key not null,
    leaderboard_name varchar(40),
	log_channel varchar(30), 
	webhook_url text,
	ignored_role varchar(30)
);

create table JikanGuildLeaderboard_1122615524942155841 (
	user_id varchar(30) primary key not null,
    user_name varchar(50) not null,
    vc_time bigint not null
);

create table JikanGuildLeaderboardTemp_1122615524942155841 (
	user_id varchar(30) primary key not null,
    user_name varchar(50) not null,
    join_time bigint not null
);

create table JikanGlobalLeaderboard (
    user_id varchar(30) primary key not null,
    user_name varchar(50) not null,
    vc_time bigint not null
);

-- flat ver.
--
-- guild leaderboard creation
-- create table JikanGuildLeaderboard_1122615524942155841 (user_id varchar(30) primary key not null, user_name varchar(50) not null, vc_time bigint not null)
-- test