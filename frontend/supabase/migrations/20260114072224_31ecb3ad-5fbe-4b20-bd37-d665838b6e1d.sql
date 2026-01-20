-- Make kb_articles author_id nullable for system articles
ALTER TABLE public.kb_articles ALTER COLUMN author_id DROP NOT NULL;

-- Insert KB articles without author (system articles)
INSERT INTO public.kb_articles (title, content, category, tags, is_public, author_id) VALUES
  ('איך להתחבר ל-VPN', '# התחברות ל-VPN

1. פתח את תוכנת ה-VPN
2. הכנס את שם המשתמש והסיסמה
3. לחץ על "התחבר"

אם יש בעיה, פנה לתמיכה.', 'רשת', ARRAY['vpn', 'רשת', 'התחברות'], true, NULL),
  ('איפוס סיסמה', '# איפוס סיסמה

1. לחץ על "שכחתי סיסמה" במסך הכניסה
2. הכנס את כתובת האימייל שלך
3. בדוק את תיבת הדואר וקבל לינק לאיפוס', 'הרשאות', ARRAY['סיסמה', 'איפוס', 'חשבון'], true, NULL);