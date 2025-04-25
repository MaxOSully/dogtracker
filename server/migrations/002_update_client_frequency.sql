-- Convert existing frequency values to days
UPDATE clients
SET frequency = CASE frequency
    WHEN 'Weekly' THEN '7'
    WHEN 'Bi-weekly' THEN '14'
    WHEN 'Monthly' THEN '30'
    WHEN 'Every 2 Months' THEN '60'
    WHEN 'As Needed' THEN '0'
    ELSE NULL
END;

-- Alter the column type
ALTER TABLE clients
ALTER COLUMN frequency TYPE integer USING frequency::integer;

-- Rename the column
ALTER TABLE clients
RENAME COLUMN frequency TO frequency_days; 