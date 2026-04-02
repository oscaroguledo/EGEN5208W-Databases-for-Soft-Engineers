#!/bin/bash
set -e

echo "🗄️ Initializing database..."

# Wait for PostgreSQL to be ready
until pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB"; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Execute DDL (schema creation)
echo "📋 Creating database schema..."
if [ -f "/app/sql/DDL.sql" ]; then
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /app/sql/DDL.sql
  echo "✅ DDL executed successfully"
else
  echo "❌ DDL.sql not found"
  exit 1
fi

# Execute DML (sample data)
echo "📊 Inserting sample data..."
if [ -f "/app/sql/DML.sql" ]; then
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /app/sql/DML.sql
  echo "✅ DML executed successfully"
else
  echo "❌ DML.sql not found"
  exit 1
fi

# Verify initialization
echo "🔍 Verifying database initialization..."
TABLES=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "✅ Database initialized with $TABLES tables"

echo "🚀 Database initialization complete!"
