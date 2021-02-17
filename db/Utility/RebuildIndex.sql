-- Output script to rebuild all indexes
SELECT 'ALTER INDEX ALL ON ' + TABLE_SCHEMA + '.' + TABLE_NAME + '  REBUILD;'
FROM Information_Schema.tables
WHERE TABLE_TYPE = 'BASE TABLE';