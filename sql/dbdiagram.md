// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs
Enum user_role {
  admin
  trainer
  member
}
Enum gender {
  male
  female
}
Table users {
  id uuid [primary key]
  email varchar [not null, unique]
  password varchar [not null]
  role user_role [not null, default: 'member']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}

Table members {
  id uuid [primary key, ref: > users.id]
  full_name varchar [not null]
  date_of_birth date [not null]
  gender gender [not null]
  phone varchar [not null, unique]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  deleted_at timestamp
}
Table trainers {
  id uuid [primary key, ref: > users.id]
  full_name varchar [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  deleted_at timestamp
}
Table admin_staff {
  id uuid [primary key, ref: > users.id]
  full_name varchar [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  deleted_at timestamp
}

Table subscriptions {
  id uuid [primary key]
  plan varchar [not null]
  fee decimal(10,2) [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}
Enum subscription_status {
  active
  expired
  cancelled
  suspended
}
Table member_subscriptions {
  id uuid [primary key]
  member_id uuid [not null, ref: > members.id]
  subscription_id uuid [not null, ref: > subscriptions.id]
  start_date date [not null]
  end_date date
  status subscription_status [not null, default: 'active']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}
Table fitness_goals {
  id uuid [primary key]
  member_id uuid [not null, ref: > members.id]
  description text [not null]
  target_value varchar
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  Indexes {
    (member_id, created_at)
  }
}

Table health_metrics {
  id uuid [primary key]
  member_id uuid [not null, ref: > members.id]
  metric_type varchar [not null]
  metric_value decimal(10,2) [not null]
  recorded_at timestamp [not null]
  created_at timestamp [not null, default: `now()`]
  Indexes {
    (member_id, recorded_at)
  }
}

Table trainer_availability {
  id uuid [primary key]
  trainer_id uuid [not null, ref: > trainers.id]
  available_date date [not null]
  start_at time [not null]
  end_at time [not null]
  created_at timestamp [not null, default: `now()`]
}

Table rooms  {
  id uuid [primary key]
  name varchar [not null]
  capacity int [not null]
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
}
Table classes {
  id uuid [primary key]
  name varchar [not null]
  trainer_id uuid [not null, ref: > trainers.id]
  room_id uuid [not null, ref: > rooms.id]
  class_date date [not null]
  start_time time [not null]
  end_time time [not null]
  max_capacity int [not null, default: 20]
  created_at timestamp [not null, default: `now()`]
  deleted_at timestamp
  Indexes {
    (trainer_id, class_date, start_time)
    (room_id, class_date, start_time)
  }
}

Table enrollments {
  id uuid [primary key]
  member_id uuid [not null, ref: > members.id]
  class_id uuid [not null, ref: > classes.id]
  registered_at timestamp [not null, default: `now()`]

  Indexes {
    (class_id, member_id) [unique]
  }
}
Enum session_status {
  scheduled
  cancelled
  completed
}

Table training_sessions {
  id uuid [primary key]
  trainer_id uuid [not null, ref: > trainers.id]
  member_id uuid [not null, ref: > members.id]
  room_id uuid [not null, ref: > rooms.id]

  session_date date [not null]
  start_time time [not null]
  end_time time [not null]

  status session_status [not null, default: 'scheduled']
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  Indexes {
    (trainer_id, session_date, start_time)
    (room_id, session_date, start_time)
    (member_id, session_date)
  }
}
Enum equipment_status {
  operational
  under_repair
  out_of_service
}

Table equipments {
  id uuid [primary key]
  room_id uuid [not null, ref: > rooms.id]
  equipment_name varchar [not null]
  status equipment_status [not null, default: 'operational']
  maintenance_notes text
  created_at timestamp [not null, default: `now()`]
  updated_at timestamp [not null, default: `now()`]
  deleted_at timestamp
}
Enum payment_status {
  pending
  paid
  failed
  refunded
}
Table payments {
  id uuid [primary key]
  member_id uuid [not null, ref: > members.id]
  subscription_id uuid [not null, ref: > member_subscriptions.id]
  amount decimal(10,2) [not null]
  paid_at timestamp [not null]
  payment_method varchar(100) [not null]
  deleted_at timestamp
  status payment_status [not null, default: 'pending']
  created_at timestamp [not null, default: `now()`]
  Indexes {
    (member_id)
    (paid_at)
    (status)
  }
}
