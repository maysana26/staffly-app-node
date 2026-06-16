-- 1. Create Users Table (Handles both Admins and Applicants)
create table users (
   user_id      serial primary key,
   name         varchar(100) not null,
   email        varchar(150) unique not null,
   password     varchar(255) not null,
   role         varchar(20) not null check ( role in ( 'admin',
                                               'applicant' ) ),
   rating       numeric(3,2) default 5.00,
   total_events int default 0,
   member_since timestamp default current_timestamp,
   about        text,
   skills       text -- PostgreSQL Array type to cleanly store multiple skill tags
);


-- 2. Create Events Table (Admin-managed core container)
create table events (
   event_id    serial primary key,
   title       varchar(200) not null,
   location    varchar(255) not null,
   date        timestamp not null, -- Essential for checking the 48-hour lock-in rule
   category    varchar(100) default 'General',
   description text,
   created_by  int
      references users ( user_id )
         on delete set null,
   created_at  timestamp default current_timestamp
);

-- 3. Create Event Roles Table (Handles specific slot requirements per event)
create table event_roles (
   role_id      serial primary key,
   event_id     int
      references events ( event_id )
         on delete cascade,
   role_name    varchar(100) not null, -- e.g., 'Cleaner', 'Lighting Tech', 'Kitchen Staff'
   slots_needed int not null check ( slots_needed > 0 ),
   slots_filled int default 0 check ( slots_filled <= slots_needed )
);

-- 4. Create Applications Table (Connects applicants to a precise event role slot)
create table applications (
   application_id serial primary key,
   applicant_id   int
      references users ( user_id )
         on delete cascade,
   role_id        int
      references event_roles ( role_id )
         on delete cascade,
   status         varchar(20) default 'Pending' check ( status in ( 'Pending',
                                                            'Accepted',
                                                            'Declined' ) ),
   applied_at     timestamp default current_timestamp,
   constraint unique_applicant_role unique ( applicant_id,
                                             role_id ) -- Prevents duplicate entries
);


-- 5. Create Feedback Table (Admin-to-Applicant post-event evaluations)
create table feedback (
   feedback_id        serial primary key,
   event_id           int
      references events ( event_id )
         on delete cascade,
   admin_id           int
      references users ( user_id )
         on delete set null,
   applicant_id       int
      references users ( user_id )
         on delete cascade,
   rating_score       int not null check ( rating_score between 1 and 5 ),
   experience_comment text,
   points_awarded     int default 0,
   submitted_at       timestamp default current_timestamp
);

-- Insert a test Admin and Applicant
insert into users (
   name,
   email,
   password,
   role,
   about,
   skills
) values ( 'Maysana Admin',
           'admin@staffly.com',
           '0000',
           'admin',
           'Lead Coordinator',
           '{}' ),( 'Sarah Johnson',
                    'sarah@staffly.com',
                    'password123',
                    'applicant',
                    'Experienced event crew worker.',
                    '{"Customer Service", "Registration Desk"}' );


-- Insert an initial Event
insert into events (
   title,
   location,
   date,
   category,
   description,
   created_by
) values ( 'Tech Innovation Summit 2026',
           'Convention Center, Downtown',
           '2026-08-15 09:00:00',
           'Technology',
           'An elite development challenge gathering.',
           1 );

-- Split that event into explicit micro-role demands (e.g., 3 Cleaners, 2 Light Managers)
insert into event_roles (
   event_id,
   role_name,
   slots_needed
) values ( 1,
           'Cleaner',
           3 ),( 1,
                 'Lighting Manager',
                 2 ),( 1,
                       'Registration Staff',
                       5 );

select *
  from events;