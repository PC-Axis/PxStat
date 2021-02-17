-- Drop Stored Procedures
DECLARE @name VARCHAR(500)
DECLARE cur CURSOR
FOR
SELECT [name]
FROM [sys].[objects]
WHERE type = 'p'

OPEN cur

FETCH NEXT
FROM cur
INTO @name

WHILE @@fetch_status = 0
BEGIN
	EXEC ('DROP PROCEDURE [' + @name + ']')

	FETCH NEXT
	FROM cur
	INTO @name
END

CLOSE cur

DEALLOCATE cur