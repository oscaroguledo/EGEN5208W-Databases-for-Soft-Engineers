#!/bin/bash
set -e

echo "🗄️ Initializing database..."

# Files are in the same directory as this script (/docker-entrypoint-initdb.d)
SCRIPT_DIR="$(dirname "$0")"

# Execute DDL (schema creation)
echo "📋 Creating database schema..."
if [ -f "$SCRIPT_DIR/DDL.sql" ]; then
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$SCRIPT_DIR/DDL.sql"
  echo "✅ DDL executed successfully"
else
  echo "❌ DDL.sql not found at $SCRIPT_DIR/DDL.sql"
  exit 1
fi

# Execute DML (sample data)
echo "📊 Inserting sample data..."
if [ -f "$SCRIPT_DIR/DML.sql" ]; then
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$SCRIPT_DIR/DML.sql"
  echo "✅ DML executed successfully"
else
  echo "❌ DML.sql not found at $SCRIPT_DIR/DML.sql"
  exit 1
fi

# Verify initialization
echo "🔍 Verifying database initialization..."
TABLES=$(psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
echo "✅ Database initialized with $TABLES tables"

echo "🚀 Database initialization complete!"
