-- ============================================================================
-- 00023_translate_default_jars_vi.sql
-- Translate default system jar names to Vietnamese for existing households.
-- ============================================================================

UPDATE public.jar_definitions
SET name = CASE slug
  WHEN 'necessities' THEN 'Nhu cầu thiết yếu'
  WHEN 'education' THEN 'Giáo dục'
  WHEN 'financial-freedom' THEN 'Tự do tài chính'
  WHEN 'long-term-savings' THEN 'Tiết kiệm dài hạn'
  WHEN 'play' THEN 'Hưởng thụ'
  WHEN 'give' THEN 'Cho đi'
  ELSE name
END,
updated_at = now()
WHERE is_system_default = true
  AND slug IN (
    'necessities',
    'education',
    'financial-freedom',
    'long-term-savings',
    'play',
    'give'
  );

-- Normalize legacy migration note to Vietnamese for consistency
UPDATE public.jar_ledger_entries
SET note = 'Khởi tạo từ mục tiêu đang hoạt động'
WHERE source_kind = 'migration_seed'
  AND note = 'Seeded from active goals';
