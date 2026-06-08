UPDATE public.bucket_configs
SET group_name = CASE name
  WHEN 'Fun' THEN 'Personal'
  WHEN 'Fun Money' THEN 'Personal'
  WHEN 'Wifey' THEN 'Personal'
  WHEN 'Tools' THEN 'Business'
  WHEN 'Shop Rent' THEN 'Business'
  WHEN 'Taxes' THEN 'Taxes'
  WHEN 'Tax Reserve' THEN 'Taxes'
  WHEN 'Savings' THEN 'Savings'
  WHEN 'Essentials' THEN 'Essentials'
  WHEN 'Car Payment' THEN 'Bills'
  WHEN 'House Rent' THEN 'Bills'
  ELSE group_name
END
WHERE group_name IS NULL
  AND name IN (
    'Fun',
    'Fun Money',
    'Wifey',
    'Tools',
    'Shop Rent',
    'Taxes',
    'Tax Reserve',
    'Savings',
    'Essentials',
    'Car Payment',
    'House Rent'
  );
