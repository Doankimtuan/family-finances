-- ============================================================================
-- 00042_translate_categories_and_jars_vi.sql
-- Translate system categories and default jars to Vietnamese.
-- ============================================================================

-- 1) Translate system categories
UPDATE public.categories SET name = 'Lương' WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE public.categories SET name = 'Thưởng' WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE public.categories SET name = 'Làm thêm' WHERE id = '10000000-0000-0000-0000-000000000003';
UPDATE public.categories SET name = 'Thu nhập đầu tư' WHERE id = '10000000-0000-0000-0000-000000000004';
UPDATE public.categories SET name = 'Quà tặng' WHERE id = '10000000-0000-0000-0000-000000000005';
UPDATE public.categories SET name = 'Cho thuê' WHERE id = '10000000-0000-0000-0000-000000000006';
UPDATE public.categories SET name = 'Thu nhập khác' WHERE id = '10000000-0000-0000-0000-000000000007';

UPDATE public.categories SET name = 'Đi chợ/Siêu thị' WHERE id = '20000000-0000-0000-0000-000000000001';
UPDATE public.categories SET name = 'Nhà ở' WHERE id = '20000000-0000-0000-0000-000000000002';
UPDATE public.categories SET name = 'Di chuyển' WHERE id = '20000000-0000-0000-0000-000000000003';
UPDATE public.categories SET name = 'Hóa đơn (Điện/Nước)' WHERE id = '20000000-0000-0000-0000-000000000004';
UPDATE public.categories SET name = 'Sức khỏe' WHERE id = '20000000-0000-0000-0000-000000000005';
UPDATE public.categories SET name = 'Giáo dục' WHERE id = '20000000-0000-0000-0000-000000000006';
UPDATE public.categories SET name = 'Giải trí' WHERE id = '20000000-0000-0000-0000-000000000007';
UPDATE public.categories SET name = 'Mua sắm' WHERE id = '20000000-0000-0000-0000-000000000008';
UPDATE public.categories SET name = 'Cá nhân' WHERE id = '20000000-0000-0000-0000-000000000009';
UPDATE public.categories SET name = 'Trợ cấp gia đình' WHERE id = '20000000-0000-0000-0000-000000000010';
UPDATE public.categories SET name = 'Bảo hiểm' WHERE id = '20000000-0000-0000-0000-000000000011';
UPDATE public.categories SET name = 'Trả nợ' WHERE id = '20000000-0000-0000-0000-000000000012';
UPDATE public.categories SET name = 'Chi phí khác' WHERE id = '20000000-0000-0000-0000-000000000013';

-- 2) Translate 'Unassigned' jar from 00034
UPDATE public.jar_definitions
SET name = 'Chưa phân loại'
WHERE slug = 'unassigned' AND name = 'Unassigned';

-- 3) Translate any potential English names in the new jars table
UPDATE public.jars
SET name = CASE slug
  WHEN 'essential' THEN 'Thiết yếu'
  WHEN 'ffa' THEN 'Tự do tài chính'
  WHEN 'lts' THEN 'Tiết kiệm dài hạn'
  WHEN 'education' THEN 'Giáo dục'
  WHEN 'play' THEN 'Hưởng thụ'
  WHEN 'give' THEN 'Cho đi'
  ELSE name
END
WHERE name IN ('Essential', 'Financial Freedom', 'Long-term Saving', 'Education', 'Play', 'Give');
